import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function checkSession(req: NextRequest, domain: string, requiredRole?: string | string[]) {
    const sessionId = req.cookies.get('session-token')?.value;

    if (!sessionId) return null;

    const user = await prisma.user.findUnique({
        where: { id: sessionId },
        include: { tenant: true }
    });

    if (!user || user.tenant.subdomain !== domain) return null;

    if (requiredRole) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (!roles.includes(user.role)) return null;
    }

    return user;
}
