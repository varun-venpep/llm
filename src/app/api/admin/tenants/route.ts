import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { ALL_TENANT_ADMIN_PERMISSIONS, normalizeTenantAdminPermissions } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const ensureTenantAdminPermissionsColumn = () => prisma.$executeRaw`
    ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS "tenantAdminPermissions" TEXT[] DEFAULT ARRAY[]::TEXT[]
`;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, adminEmail, adminPassword, globalMarketplaceEnabled, courseCredits, courseCreateCount } = body;
        const subdomain = typeof body.subdomain === 'string' ? body.subdomain.trim().toLowerCase() : '';
        const tenantAdminPermissions = normalizeTenantAdminPermissions(body.tenantAdminPermissions);
        const adminPermissions = tenantAdminPermissions.length > 0 ? tenantAdminPermissions : ALL_TENANT_ADMIN_PERMISSIONS;

        // Basic validation
        if (!name || !subdomain || !adminEmail || !adminPassword) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if tenant or subdomain exists
        const existingTenant = await prisma.tenant.findUnique({
            where: { subdomain },
        });

        if (existingTenant) {
            return NextResponse.json({ error: 'Subdomain already taken' }, { status: 400 });
        }

        await ensureTenantAdminPermissionsColumn();

        // Create Tenant and Admin User in a transaction
        const result = await prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    name,
                    subdomain,
                    primaryColor: '#3b82f6',
                    globalMarketplaceEnabled: globalMarketplaceEnabled || false,
                    courseCredits: courseCredits || 0
                },
            });

            // Set courseCreateCount using a raw query to prevent errors if the generated client is out of sync
            const targetCount = courseCreateCount !== undefined ? parseInt(String(courseCreateCount), 10) : 0;
            await tx.$executeRawUnsafe(
                'UPDATE "Tenant" SET "courseCreateCount" = $1 WHERE "id" = $2',
                targetCount,
                tenant.id
            );

            const hashedPassword = await bcrypt.hash(adminPassword, 10);

            const user = await tx.user.create({
                data: {
                    email: adminEmail,
                    password: hashedPassword,
                    name: 'Tenant Admin',
                    role: 'TENANT_ADMIN',
                    tenantId: tenant.id,
                },
            });

            return { tenant, user };
        });

        if (adminPermissions.length > 0) {
            await prisma.$executeRaw`
                UPDATE "User"
                SET "tenantAdminPermissions" = ARRAY[${Prisma.join(adminPermissions)}]::TEXT[]
                WHERE "id" = ${result.user.id}
            `;
        } else {
            await prisma.$executeRaw`
                UPDATE "User"
                SET "tenantAdminPermissions" = ARRAY[]::TEXT[]
                WHERE "id" = ${result.user.id}
            `;
        }

        const createdTenant = await prisma.tenant.findUnique({
            where: { id: result.tenant.id },
            select: { id: true, name: true, subdomain: true, isActive: true, createdAt: true }
        });

        if (!createdTenant) {
            return NextResponse.json({ error: 'Workspace was not committed. Please retry.' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            tenantId: createdTenant.id,
            message: 'Workspace created successfully',
            tenant: createdTenant
        });

    } catch (error: any) {
        console.error('Tenant creation error:', error);
        return NextResponse.json({ 
            error: error?.message || 'Internal server error',
            details: String(error),
            stack: error?.stack 
        }, { status: 500 });
    }
}

export async function GET() {
    try {
        await ensureTenantAdminPermissionsColumn();

        const tenants = await prisma.tenant.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                users: {
                    where: { role: 'TENANT_ADMIN' },
                    take: 1,
                    select: { id: true, email: true }
                },
                _count: {
                    select: { users: true, courses: true }
                }
            }
        });

        // Add adminEmail to the response for consumption in the UI
        const formattedTenants = await Promise.all(tenants.map(async tenant => {
            const adminId = tenant.users[0]?.id;
            const permissionRows = adminId ? await prisma.$queryRaw<{ tenantAdminPermissions: string[] | null }[]>`
                SELECT "tenantAdminPermissions"
                FROM "User"
                WHERE "id" = ${adminId}
                LIMIT 1
            ` : [];

            return {
                ...tenant,
                adminEmail: tenant.users[0]?.email || null,
                tenantAdminPermissions: permissionRows[0]?.tenantAdminPermissions || []
            };
        }));

        return NextResponse.json(formattedTenants);
    } catch (error) {
        console.error('Tenant fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 });
    }
}
