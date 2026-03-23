import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const [tenantCount, userCount, courseCount, enrollmentCount] = await Promise.all([
            prisma.tenant.count({ where: { isActive: true, subdomain: { not: 'admin-system' } } }),
            prisma.user.count({ where: { role: { not: 'SUPER_ADMIN' } } }),
            prisma.course.count(),
            prisma.enrollment.count()
        ]);

        const recentTenants = await prisma.tenant.findMany({
            where: { subdomain: { not: 'admin-system' } },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: { id: true, name: true, subdomain: true, isActive: true, createdAt: true }
        });

        return NextResponse.json({
            tenantCount,
            userCount,
            courseCount,
            enrollmentCount,
            recentTenants
        });
    } catch (e) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
