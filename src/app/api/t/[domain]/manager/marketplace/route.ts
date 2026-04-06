import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkSession } from '@/lib/auth';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    try {
        const { domain } = await params;
        const tenant = await prisma.tenant.findUnique({ where: { subdomain: domain } });
        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        // Learners masquerading as Managers
        const session = await checkSession(req, domain);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Fetch courses marked as Marketplace
        const marketplaceCourses = await prisma.course.findMany({
            where: {
                tenantId: tenant.id,
                isPublished: true,
                isMarketplace: true
            },
            select: {
                id: true,
                title: true,
                description: true,
                thumbnail: true,
                skillLevel: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(marketplaceCourses);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch marketplace courses' }, { status: 500 });
    }
}
