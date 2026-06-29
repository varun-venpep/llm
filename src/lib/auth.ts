import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasTenantPermission } from '@/lib/permissions';

export async function checkSession(req: NextRequest, domain: string, requiredRole?: string | string[]) {
    let portal: 'admin' | 'learner' | null = null;

    // 1. Check explicit portal query param
    const portalParam = req.nextUrl.searchParams.get('portal');
    if (portalParam === 'admin') portal = 'admin';
    else if (portalParam === 'learner') portal = 'learner';

    // 2. Check Referer header to infer portal
    if (!portal) {
        const referer = req.headers.get('referer');
        if (referer) {
            try {
                const path = new URL(referer).pathname;
                if (path.includes('/admin')) {
                    portal = 'admin';
                } else if (path.includes('/dashboard') || path.includes('/course') || path.includes('/achievements')) {
                    portal = 'learner';
                }
            } catch (e) {
                // Ignore URL parsing errors
            }
        }
    }

    // 3. Check requiredRole as a fallback
    if (!portal && requiredRole) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        const isAdminRole = roles.some(r => ['SUPER_ADMIN', 'TENANT_ADMIN', 'PLATFORM_MANAGER', 'INSTRUCTOR', 'TEACHER'].includes(r));
        if (isAdminRole) {
            portal = 'admin';
        } else if (roles.includes('LEARNER')) {
            portal = 'learner';
        }
    }

    // 4. Retrieve cookie based on determined portal
    let sessionId = portal === 'admin'
        ? (req.cookies.get('admin_token')?.value || req.cookies.get('session-token')?.value)
        : portal === 'learner'
        ? (req.cookies.get('learner_token')?.value || req.cookies.get('admin_token')?.value || req.cookies.get('session-token')?.value)
        : (req.cookies.get('admin_token')?.value || req.cookies.get('learner_token')?.value || req.cookies.get('session-token')?.value);

    if (!sessionId) {
        const authHeader = req.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            sessionId = authHeader.substring(7);
        }
    }

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
        const isUserAdmin = ['SUPER_ADMIN', 'TENANT_ADMIN', 'PLATFORM_MANAGER', 'INSTRUCTOR', 'TEACHER'].includes(user.role);
        const isLearnerRequest = roles.includes('LEARNER');
        if (!roles.includes(user.role) && !hasExplicitDomainPermissions && !(isLearnerRequest && isUserAdmin)) return null;
    }

    return userWithPermissions;
}

export function requireTenantPermission(
    user: { role?: string; tenantAdminPermissions?: string[] | null } | null,
    permission: string
) {
    return !!user && hasTenantPermission(user, permission);
}
