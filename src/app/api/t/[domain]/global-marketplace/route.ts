import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - list all global marketplace courses for a tenant
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    const { domain } = await params;
    try {
        const tenant = await prisma.tenant.findUnique({ where: { subdomain: domain } });
        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        if (!tenant.globalMarketplaceEnabled) {
            return NextResponse.json({ error: 'Global Marketplace not enabled for this workspace' }, { status: 403 });
        }

        // Fetch all published global courses with their claim status for this tenant
        const [courses, claims] = await Promise.all([
            prisma.course.findMany({
                where: { isGlobal: true, isPublished: true },
                include: {
                    modules: {
                        include: { lessons: { select: { id: true } } },
                        orderBy: { order: 'asc' }
                    },
                    _count: { select: { marketplaceClaims: true } }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.marketplaceClaim.findMany({
                where: { tenantId: tenant.id },
                select: { sourceCourseId: true }
            })
        ]);

        const claimedSourceIds = new Set(claims.map(c => c.sourceCourseId));
        const coursesWithClaimStatus = courses.map(c => ({
            ...c,
            isClaimed: claimedSourceIds.has(c.id)
        }));

        return NextResponse.json({
            courses: coursesWithClaimStatus,
            courseCredits: tenant.courseCredits
        });
    } catch (e) {
        console.error('Failed to fetch marketplace:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
