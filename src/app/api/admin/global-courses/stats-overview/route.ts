import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const [totalCourses, totalClaims, totalEnrollments, recentClaims] = await Promise.all([
            prisma.course.count({ where: { isGlobal: true } }),
            prisma.marketplaceClaim.count(),
            prisma.enrollment.count({ where: { course: { clonedFromId: { not: null } } } }),
            prisma.marketplaceClaim.findMany({
                include: {
                    tenant: { select: { name: true } },
                    course: { select: { title: true } }
                },
                orderBy: { claimedAt: 'desc' },
                take: 10
            })
        ]);

        // Aggregate claim trend data for charts (last 7 days) using raw JS Date logic
        const claimTrend = await Promise.all(
            Array.from({ length: 7 }).map(async (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
                
                const count = await prisma.marketplaceClaim.count({
                    where: {
                        claimedAt: {
                            gte: start,
                            lt: end
                        }
                    }
                });
                return {
                    name: date.toLocaleDateString('en-US', { weekday: 'short' }),
                    claims: count,
                    fullDate: date.toISOString()
                };
            })
        );

        // Aggregate enrollment trend data (last 7 days)
        const enrollmentTrend = await Promise.all(
            Array.from({ length: 7 }).map(async (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

                const count = await prisma.enrollment.count({
                    where: {
                        createdAt: {
                            gte: start,
                            lt: end
                        },
                        course: { clonedFromId: { not: null } }
                    }
                });
                return {
                    name: date.toLocaleDateString('en-US', { weekday: 'short' }),
                    enrollments: count,
                    fullDate: date.toISOString()
                };
            })
        );

        return NextResponse.json({
            totalCourses,
            totalClaims,
            totalEnrollments,
            recentClaims,
            claimGrowth: claimTrend.reverse(),
            enrollmentGrowth: enrollmentTrend.reverse()
        });
    } catch (e) {
        console.error('Failed to fetch global stats overview:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
