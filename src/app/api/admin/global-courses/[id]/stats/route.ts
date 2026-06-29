import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
    const { id } = await params;

    try {
        // 1. Find the global course and its claim records
        const claims = await prisma.marketplaceClaim.findMany({
            where: { sourceCourseId: id },
            include: {
                tenant: { select: { name: true, subdomain: true } },
                course: {
                    select: {
                        id: true,
                        _count: { select: { enrollments: true } },
                        modules: {
                            select: {
                                lessons: { select: { id: true } }
                            }
                        }
                    }
                }
            }
        });

        const totalClaims = claims.length;
        const claimedCourseIds = claims.map(c => c.courseId);

        // 2. Aggregate Enrollments and Progress
        // We'll fetch all enrollments for these claimed courses
        const enrollments = await prisma.enrollment.findMany({
            where: { courseId: { in: claimedCourseIds } },
            include: {
                user: { select: { name: true, email: true } },
                course: {
                    select: {
                        tenantId: true,
                        modules: {
                            select: {
                                lessons: { select: { id: true } }
                            }
                        }
                    }
                }
            }
        });

        const totalEnrollments = enrollments.length;

        // 3. Calculate Completions
        // A learner is completed if they have LessonProgress records for all lessons in their course
        // This is a bit expensive, but for a global view it's necessary.

        let totalCompletions = 0;
        const learnerStats: any[] = [];

        for (const enrollment of enrollments) {
            const allLessonIds = enrollment.course.modules.flatMap(m => m.lessons.map(l => l.id));
            const totalLessons = allLessonIds.length;

            if (totalLessons === 0) continue;

            const completedLessonsCount = await prisma.lessonProgress.count({
                where: {
                    userId: enrollment.userId,
                    lessonId: { in: allLessonIds },
                    completed: true
                }
            });

            const percentage = Math.round((completedLessonsCount / totalLessons) * 100);
            const isCompleted = completedLessonsCount === totalLessons;
            if (isCompleted) totalCompletions++;

            // For the breakdown, we find the claim that matches this enrollment's tenant
            const claim = claims.find(c => c.tenantId === enrollment.course.tenantId);

            learnerStats.push({
                userId: enrollment.userId,
                name: enrollment.user.name,
                email: enrollment.user.email,
                tenantName: claim?.tenant.name || 'Unknown',
                percentage,
                isCompleted,
                completedCount: completedLessonsCount,
                totalLessons
            });
        }

        // 4. Tenant Breakdown
        const tenantBreakdown = claims.map(c => {
            const tenantEnrollments = enrollments.filter(e => e.course.tenantId === c.tenantId);
            const completions = learnerStats.filter(ls => ls.tenantName === c.tenant.name && ls.isCompleted).length;

            return {
                tenantId: c.tenantId,
                name: c.tenant.name,
                subdomain: c.tenant.subdomain,
                enrollments: tenantEnrollments.length,
                completions
            };
        });

        return NextResponse.json({
            totalClaims,
            totalEnrollments,
            totalCompletions,
            avgCompletionRate: totalEnrollments > 0 ? Math.round((totalCompletions / totalEnrollments) * 100) : 0,
            learnerStats: learnerStats.slice(0, 100), // Limit to top 100 for safety
            tenantBreakdown
        });

    } catch (e: any) {
        console.error('Failed to aggregate global course stats:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
