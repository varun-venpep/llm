import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    const { domain } = await params;
    try {
        const tenant = await prisma.tenant.findUnique({
            where: { subdomain: domain },
            include: {
                _count: {
                    select: {
                        users: { where: { role: 'STUDENT' } },
                        courses: true,
                    }
                }
            }
        });

        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        // 1. Basic Counts
        const studentCount = tenant._count.users;
        const courseCount = tenant._count.courses;

        // 2. Enrollments & Completions
        const enrollments = await prisma.enrollment.findMany({
            where: { course: { tenantId: tenant.id } },
            include: {
                course: {
                    include: {
                        modules: {
                            include: { _count: { select: { lessons: true } } }
                        }
                    }
                }
            }
        });

        const totalEnrollments = enrollments.length;
        
        // Calculate progress for each enrollment
        const enrollmentStats = await Promise.all(enrollments.map(async (enrol) => {
            const totalLessons = enrol.course.modules.reduce((sum, mod) => sum + mod._count.lessons, 0);
            const completedCount = await prisma.lessonProgress.count({
                where: { 
                    userId: enrol.userId, 
                    lesson: { module: { courseId: enrol.courseId } },
                    completed: true 
                }
            });

            return {
                isCompleted: totalLessons > 0 && completedCount === totalLessons,
                progress: totalLessons > 0 ? (completedCount / totalLessons) : 0
            };
        }));

        const totalCompletions = enrollmentStats.filter(e => e.isCompleted).length;
        const avgProgress = enrollmentStats.length > 0 
            ? (enrollmentStats.reduce((sum, e) => sum + e.progress, 0) / enrollmentStats.length) * 100
            : 0;
        const completionRate = totalEnrollments > 0 ? (totalCompletions / totalEnrollments) * 100 : 0;

        // 3. Quiz Stats
        const quizAttempts = await prisma.quizAttempt.findMany({
            where: { user: { tenantId: tenant.id } },
            select: { score: true, passed: true }
        });

        const avgQuizScore = quizAttempts.length > 0
            ? quizAttempts.reduce((sum, a) => sum + a.score, 0) / quizAttempts.length
            : 0;

        // 4. Recent Activity (Latest 10 logs)
        const recentActivity = await prisma.activityLog.findMany({
            where: { user: { tenantId: tenant.id } },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                user: { select: { name: true, email: true } }
            }
        });

        // 5. Course Performance Summary
        const courses = await prisma.course.findMany({
            where: { tenantId: tenant.id },
            include: {
                _count: { select: { enrollments: true } },
                modules: { include: { _count: { select: { lessons: true } } } }
            }
        });

        const coursePerformance = await Promise.all(courses.map(async (c) => {
            const totalLessons = c.modules.reduce((sum, m) => sum + m._count.lessons, 0);
            
            // Get all student progress for this course
            const progresses = await prisma.lessonProgress.findMany({
                where: { lesson: { module: { courseId: c.id } }, completed: true }
            });

            const totalEnrollments = c._count.enrollments;
            // Simple completion check: totalCompleted / (totalEnrollments * totalLessons)
            // But better: per student completion
            const studentEnrollments = await prisma.enrollment.findMany({ where: { courseId: c.id } });
            
            let completions = 0;
            let sumProgress = 0;

            for (const enrol of studentEnrollments) {
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
                enrollments: totalEnrollments,
                completions,
                avgProgress: studentEnrollments.length > 0 ? (sumProgress / studentEnrollments.length) * 100 : 0
            };
        }));

        return NextResponse.json({
            stats: {
                students: studentCount,
                courses: courseCount,
                enrollments: totalEnrollments,
                completions: totalCompletions,
                completionRate: Math.round(completionRate),
                avgProgress: Math.round(avgProgress),
                avgQuizScore: Math.round(avgQuizScore)
            },
            recentActivity,
            coursePerformance
        });
    } catch (e) {
        console.error('[ADMIN_STATS_GET]', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
