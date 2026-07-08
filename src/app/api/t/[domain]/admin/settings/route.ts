import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkSession, requireTenantPermission } from '@/lib/auth';
import { execSync } from 'child_process';

const ensureCourseCreateCountColumn = async () => {
    try {
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "Tenant"
            ADD COLUMN IF NOT EXISTS "courseCreateCount" INTEGER NOT NULL DEFAULT 0
        `);
        try {
            execSync('npx prisma generate', { stdio: 'ignore' });
        } catch (genError) {
            console.error('Error generating Prisma client:', genError);
        }
    } catch (e) {
        console.error('Error ensuring courseCreateCount column:', e);
    }
};

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    const { domain } = await params;
    try {
        const session = await checkSession(req, domain, ['TENANT_ADMIN', 'SUPER_ADMIN']);
        if (!requireTenantPermission(session, 'branding.manage')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await ensureCourseCreateCountColumn();

        const tenants = await prisma.$queryRawUnsafe<{
            plan: string;
            customRevenue: number;
            customRevenueCurrency: string;
            courseCreateCount: number;
        }[]>(
            'SELECT "plan", "customRevenue", "customRevenueCurrency", "courseCreateCount" FROM "Tenant" WHERE "subdomain" = $1 LIMIT 1',
            domain
        );

        if (!tenants || tenants.length === 0) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        return NextResponse.json({
            plan: tenants[0].plan,
            customRevenue: tenants[0].customRevenue,
            customRevenueCurrency: tenants[0].customRevenueCurrency,
            courseCreateCount: tenants[0].courseCreateCount
        });
    } catch (e: any) {
        console.error('Failed to fetch settings:', e);
        return NextResponse.json({ error: e.message || 'Internal server error', stack: e.stack }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    const { domain } = await params;
    try {
        const session = await checkSession(req, domain, ['TENANT_ADMIN', 'SUPER_ADMIN']);
        if (!requireTenantPermission(session, 'branding.manage')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await ensureCourseCreateCountColumn();

        const body = await req.json();
        const { courseCreateCount, plan } = body;
        const targetValue = parseInt(String(courseCreateCount), 10) || 0;

        if (plan) {
            await prisma.$executeRawUnsafe(
                'UPDATE "Tenant" SET "plan" = CAST($1 AS "Plan"), "courseCreateCount" = $2 WHERE "subdomain" = $3',
                plan.toUpperCase(),
                targetValue,
                domain
            );
        } else {
            await prisma.$executeRawUnsafe(
                'UPDATE "Tenant" SET "courseCreateCount" = $1 WHERE "subdomain" = $2',
                targetValue,
                domain
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                courseCreateCount: targetValue,
                plan: plan || null
            }
        });
    } catch (e: any) {
        console.error('Failed to update settings:', e);
        return NextResponse.json({ error: e.message || 'Internal server error', stack: e.stack }, { status: 500 });
    }
}
