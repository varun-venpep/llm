import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET tenant settings (public fields only) for the Tenant Admin UI
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    const { domain } = await params;
    try {
        try {
            await prisma.$executeRawUnsafe(`
                ALTER TABLE "Tenant"
                ADD COLUMN IF NOT EXISTS "courseCreateCount" INTEGER NOT NULL DEFAULT 0
            `);
        } catch (e) {
            console.error('Error ensuring courseCreateCount column in settings:', e);
        }

        const tenant = await prisma.tenant.findUnique({
            where: { subdomain: domain },
            select: {
                id: true,
                name: true,
                subdomain: true,
                globalMarketplaceEnabled: true,
                courseCredits: true,
                aiCredits: true,
                plan: true,
                isActive: true
            }
        });

        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        const countRows = await prisma.$queryRawUnsafe<{ courseCreateCount: number }[]>(
            'SELECT "courseCreateCount" FROM "Tenant" WHERE "id" = $1 LIMIT 1',
            tenant.id
        );
        const courseCreateCount = countRows[0]?.courseCreateCount || 0;

        return NextResponse.json({
            ...tenant,
            courseCreateCount
        });
    } catch (e) {
        console.error('Failed to fetch tenant settings:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
