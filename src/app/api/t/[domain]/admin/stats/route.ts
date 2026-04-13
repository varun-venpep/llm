import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    const { domain } = await params;
    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const teamIdParam = searchParams.get('teamId');
    const roleIdParam = searchParams.get('roleId');

    try {
        const tenant = await prisma.tenant.findUnique({
            where: { subdomain: domain },
        });
        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        // Date filter
        const dateFilter: any = {};
        if (startDateParam) dateFilter.gte = new Date(startDateParam);
        if (endDateParam) {
            const end = new Date(endDateParam);
            end.setHours(23, 59, 59, 999);
            dateFilter.lte = end;
        }
        const hasDate = Object.keys(dateFilter).length > 0;

        // Build learner scope (team or role filter)
        let learnerIds: string[] | null = null;
        if (teamIdParam) {
            const team = await prisma.team.findUnique({
                where: { id: teamIdParam },
                select: { members: { select: { id: true } } }
            });
            learnerIds = team?.members.map(m => m.id) || [];
        } else if (roleIdParam) {
            const role = await prisma.jobRole.findUnique({
                where: { id: roleIdParam },
                select: { users: { select: { id: true } } }
            });
            learnerIds = role?.users.map(u => u.id) || [];
        }

        const learnerWhere: any = {
            tenantId: tenant.id,
            role: 'LEARNER',
            ...(learnerIds !== null ? { id: { in: learnerIds } } : {}),
            ...(hasDate ? { createdAt: dateFilter } : {})
        };

        // 1. Basic Counts
        const [learnerCount, courseCount] = await Promise.all([
            prisma.user.count({ where: learnerWhere }),
            prisma.course.count({ where: { tenantId: tenant.id } }),
        ]);

        // 2. Enrollments & Completions (scoped)
        const enrollments = await prisma.enrollment.findMany({
            where: {
                course: { tenantId: tenant.id },
                ...(learnerIds !== null ? { userId: { in: learnerIds } } : {}),
                ...(hasDate ? { createdAt: dateFilter } : {})
            },
            include: {
                course: {
                    include: {
                        modules: { include: { _count: { select: { lessons: true } } } }
                    }
                }
            }
        });

        const totalEnrollments = enrollments.length;
        const enrollmentStats = await Promise.all(enrollments.map(async (enrol) => {
            const totalLessons = enrol.course.modules.reduce((sum, mod) => sum + mod._count.lessons, 0);
            const completedCount = await prisma.lessonProgress.count({
                where: { userId: enrol.userId, lesson: { module: { courseId: enrol.courseId } }, completed: true }
            });
            return {
                isCompleted: totalLessons > 0 && completedCount === totalLessons,
                progress: totalLessons > 0 ? completedCount / totalLessons : 0
            };
        }));

        const totalCompletions = enrollmentStats.filter(e => e.isCompleted).length;
        const avgProgress = enrollmentStats.length > 0
            ? (enrollmentStats.reduce((sum, e) => sum + e.progress, 0) / enrollmentStats.length) * 100 : 0;
        const completionRate = totalEnrollments > 0 ? (totalCompletions / totalEnrollments) * 100 : 0;

        // 3. Quiz Stats
        const quizAttempts = await prisma.quizAttempt.findMany({
            where: {
                user: { tenantId: tenant.id, ...(learnerIds !== null ? { id: { in: learnerIds } } : {}) }
            },
            select: { score: true, passed: true }
        });
        const avgQuizScore = quizAttempts.length > 0
            ? quizAttempts.reduce((sum, a) => sum + a.score, 0) / quizAttempts.length : 0;

        // 4. Recent Activity
        const recentActivity = await prisma.activityLog.findMany({
            where: { user: { tenantId: tenant.id } },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: { user: { select: { name: true, email: true } } }
        });

        // 5. Course Performance (scoped by filter)
        const courses = await prisma.course.findMany({
            where: { tenantId: tenant.id },
            include: {
                _count: { select: { enrollments: true } },
                modules: { include: { _count: { select: { lessons: true } } } }
            }
        });

        const coursePerformance = await Promise.all(courses.map(async (c) => {
            const totalLessons = c.modules.reduce((sum, m) => sum + m._count.lessons, 0);
            const learnerEnrollments = await prisma.enrollment.findMany({
                where: {
                    courseId: c.id,
                    ...(learnerIds !== null ? { userId: { in: learnerIds } } : {})
                }
            });
            let completions = 0, sumProgress = 0;
            for (const enrol of learnerEnrollments) {
                const count = await prisma.lessonProgress.count({
                    where: { userId: enrol.userId, lesson: { module: { courseId: c.id } }, completed: true }
                });
                const p = totalLessons > 0 ? count / totalLessons : 0;
                if (p >= 1) completions++;
                sumProgress += p;
            }
            return {
                id: c.id,
                title: c.title,
                enrollments: learnerEnrollments.length,
                completions,
                avgProgress: learnerEnrollments.length > 0 ? Math.round((sumProgress / learnerEnrollments.length) * 100) : 0
            };
        }));

        // 6. Team Performance Breakdown
        const teams = await prisma.team.findMany({
            where: { tenantId: tenant.id },
            include: {
                members: {
                    select: {
                        id: true,
                        name: true,
                        enrollments: { select: { courseId: true, course: { select: { modules: { include: { _count: { select: { lessons: true } } } } } } } }
                    }
                }
            }
        });

        const teamPerformance = await Promise.all(teams.map(async (team) => {
            const memberIds = team.members.map(m => m.id);
            if (memberIds.length === 0) return { id: team.id, name: team.name, members: 0, avgProgress: 0, completionRate: 0 };

            let totalProgress = 0, totalEnroll = 0, totalComplete = 0;
            for (const member of team.members) {
                for (const enrol of member.enrollments) {
                    const totalLessons = enrol.course.modules.reduce((s: number, m: any) => s + m._count.lessons, 0);
                    if (totalLessons === 0) continue;
                    const done = await prisma.lessonProgress.count({
                        where: { userId: member.id, lesson: { module: { courseId: enrol.courseId } }, completed: true }
                    });
                    const p = done / totalLessons;
                    totalProgress += p;
                    totalEnroll++;
                    if (p >= 1) totalComplete++;
                }
            }
            return {
                id: team.id,
                name: team.name,
                members: memberIds.length,
                avgProgress: totalEnroll > 0 ? Math.round((totalProgress / totalEnroll) * 100) : 0,
                completionRate: totalEnroll > 0 ? Math.round((totalComplete / totalEnroll) * 100) : 0
            };
        }));

        // 7. Top Learners (by completion %)
        const allLearners = await prisma.user.findMany({
            where: { tenantId: tenant.id, role: 'LEARNER', isActive: true, ...(learnerIds !== null ? { id: { in: learnerIds } } : {}) },
            select: { id: true, name: true, email: true, enrollments: { select: { courseId: true } } }
        });

        const topLearners = (await Promise.all(allLearners.map(async (u) => {
            if (u.enrollments.length === 0) return { id: u.id, name: u.name || u.email, email: u.email, avgProgress: 0, completedCourses: 0, totalCourses: u.enrollments.length };
            let sumProg = 0, completed = 0;
            for (const enrol of u.enrollments) {
                const course = await prisma.course.findUnique({ where: { id: enrol.courseId }, include: { modules: { include: { _count: { select: { lessons: true } } } } } });
                const totalLessons = course?.modules.reduce((s, m) => s + m._count.lessons, 0) || 0;
                if (totalLessons === 0) continue;
                const done = await prisma.lessonProgress.count({ where: { userId: u.id, lesson: { module: { courseId: enrol.courseId } }, completed: true } });
                const p = done / totalLessons;
                sumProg += p;
                if (p >= 1) completed++;
            }
            return {
                id: u.id,
                name: u.name || u.email,
                email: u.email,
                avgProgress: u.enrollments.length > 0 ? Math.round((sumProg / u.enrollments.length) * 100) : 0,
                completedCourses: completed,
                totalCourses: u.enrollments.length
            };
        }))).sort((a, b) => b.avgProgress - a.avgProgress).slice(0, 10);

        // 8. Enrollment Trend (last 6 months, by week/month)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const enrollmentTrend = await prisma.enrollment.findMany({
            where: {
                course: { tenantId: tenant.id },
                ...(learnerIds !== null ? { userId: { in: learnerIds } } : {}),
                createdAt: { gte: sixMonthsAgo }
            },
            select: { createdAt: true }
        });

        const trendByMonth: Record<string, number> = {};
        enrollmentTrend.forEach(e => {
            const key = e.createdAt.toLocaleString('default', { month: 'short', year: '2-digit' });
            trendByMonth[key] = (trendByMonth[key] || 0) + 1;
        });
        const enrollmentTrendData = Object.entries(trendByMonth).map(([date, count]) => ({ date, enrollments: count }));

        // 9. Role distribution 
        const roleStats = await prisma.jobRole.findMany({
            where: { tenantId: tenant.id },
            select: {
                id: true,
                name: true,
                _count: { select: { users: true } }
            }
        });
        const roleDistribution = roleStats.map(r => ({ name: r.name, value: r._count.users }));

        return NextResponse.json({
            stats: {
                learners: learnerCount,
                courses: courseCount,
                enrollments: totalEnrollments,
                completions: totalCompletions,
                completionRate: Math.round(completionRate),
                avgProgress: Math.round(avgProgress),
                avgQuizScore: Math.round(avgQuizScore)
            },
            recentActivity,
            coursePerformance,
            teamPerformance,
            topLearners,
            enrollmentTrendData,
            roleDistribution
        });
    } catch (e) {
        console.error('[ADMIN_STATS_GET]', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
