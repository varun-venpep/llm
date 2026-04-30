import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const sessionId = req.cookies.get('session-token')?.value;

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
