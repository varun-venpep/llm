import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkSession } from '@/lib/auth';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string; roleId: string }> }
) {
    try {
        const { domain, roleId } = await params;
        const tenant = await prisma.tenant.findUnique({ where: { subdomain: domain } });
        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        const session = await checkSession(req, domain, 'TENANT_ADMIN');
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // 1. Fetch Role and its Members
        const role = await prisma.jobRole.findUnique({
            where: { id: roleId },
            include: {
                users: {
                    where: { role: 'LEARNER' },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        enrollments: {
                            include: {
                                course: {
                                    include: {
                                        modules: {
                                            include: { _count: { select: { lessons: true } } }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!role || role.tenantId !== tenant.id) {
            return NextResponse.json({ error: 'Role not found' }, { status: 404 });
        }

        // 2. Process Stats for each user
        const memberStats = await Promise.all(role.users.map(async (user) => {
            const enrollments = user.enrollments;
            if (enrollments.length === 0) {
                return {
                    userId: user.id,
                    name: user.name,
                    email: user.email,
                    avgProgress: 0,
                    completedCourses: 0,
                    totalCourses: 0
                };
            }

            const courseProgresses = await Promise.all(enrollments.map(async (enrol) => {
                const totalLessons = enrol.course.modules.reduce((sum, mod) => sum + mod._count.lessons, 0);
                const completedCount = await prisma.lessonProgress.count({
                    where: {
                        userId: user.id,
                        lesson: { module: { courseId: enrol.courseId } },
                        completed: true
                    }
                });

                const progress = totalLessons > 0 ? (completedCount / totalLessons) : 0;
                return {
                    progress,
                    isCompleted: progress >= 1
                };
            }));

            const sumProgress = courseProgresses.reduce((sum, cp) => sum + cp.progress, 0);
            const completions = courseProgresses.filter(cp => cp.isCompleted).length;

            return {
                userId: user.id,
                name: user.name,
                email: user.email,
                avgProgress: Math.round((sumProgress / enrollments.length) * 100),
                completedCourses: completions,
                totalCourses: enrollments.length
            };
        }));

        const totalMembers = memberStats.length;
        const aggregateAvgProgress = totalMembers > 0
            ? Math.round(memberStats.reduce((sum, ms) => sum + ms.avgProgress, 0) / totalMembers)
            : 0;

        const totalCompletions = memberStats.reduce((sum, ms) => sum + ms.completedCourses, 0);
        const totalEnrollments = memberStats.reduce((sum, ms) => sum + ms.totalCourses, 0);
        const aggregateCompletionRate = totalEnrollments > 0
            ? Math.round((totalCompletions / totalEnrollments) * 100)
            : 0;

        return NextResponse.json({
            name: role.name,
            totalMembers,
            aggregateAvgProgress,
            aggregateCompletionRate,
            memberStats
        });

    } catch (error) {
        console.error('[ROLE_STATS_GET]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
