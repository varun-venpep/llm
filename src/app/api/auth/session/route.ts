import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        let portal = req.nextUrl.searchParams.get('portal');

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
                } catch (e) {}
            }
        }

        const sessionId = portal === 'admin'
            ? (req.cookies.get('admin_token')?.value || req.cookies.get('session-token')?.value)
            : portal === 'learner'
            ? (req.cookies.get('learner_token')?.value || req.cookies.get('admin_token')?.value || req.cookies.get('session-token')?.value)
            : (req.cookies.get('admin_token')?.value || req.cookies.get('learner_token')?.value || req.cookies.get('session-token')?.value);

        if (!sessionId) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: sessionId },
            select: { id: true, name: true, email: true, role: true }
        });

        if (!user) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

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

        return NextResponse.json({
            authenticated: true,
            user: {
                ...user,
                tenantAdminPermissions: permissionRows[0]?.tenantAdminPermissions || []
            }
        });

    } catch (error) {
        return NextResponse.json({ authenticated: false }, { status: 500 });
    }
}
