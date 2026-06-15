import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasTenantPermission } from '@/lib/permissions';

export async function checkSession(req: NextRequest, domain: string, requiredRole?: string | string[]) {
    const sessionId = req.cookies.get('session-token')?.value;

    if (!sessionId) return null;

    const user = await prisma.user.findUnique({
        where: { id: sessionId },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            tenantId: true,
            tenant: {
                select: {
                    id: true,
                    subdomain: true
                }
            }
        }
    });

    const isPlatformStaff = user?.role === 'SUPER_ADMIN' || user?.role === 'PLATFORM_MANAGER';
    if (!user || (user.tenant.subdomain !== domain && !isPlatformStaff)) return null;

    let permissionRows: { tenantAdminPermissions: string[] | null }[] = [];
    try {
        permissionRows = await prisma.$queryRaw<{ tenantAdminPermissions: string[] | null }[]>`
            SELECT "tenantAdminPermissions"
            FROM "User"
            WHERE "id" = ${user.id}
            LIMIT 1
        `;
    } catch (error: any) {
        if (error?.code !== 'P2010') throw error;
    }
    const userWithPermissions = {
        ...user,
        tenantAdminPermissions: permissionRows[0]?.tenantAdminPermissions || []
    };

    if (requiredRole) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        const hasExplicitDomainPermissions = userWithPermissions.tenantAdminPermissions.length > 0;
        if (!roles.includes(user.role) && !hasExplicitDomainPermissions) return null;
    }

    return userWithPermissions;
}

export function requireTenantPermission(
    user: { role?: string; tenantAdminPermissions?: string[] | null } | null,
    permission: string
) {
    return !!user && hasTenantPermission(user, permission);
}
