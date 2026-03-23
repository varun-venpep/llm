import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string; courseId: string }> }
) {
    const { courseId } = await params;
    try {
        // Get total enrollments
        const enrollments = await prisma.enrollment.findMany({
            where: { courseId },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        // Get all lessons for this course to check completion
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                modules: {
                    include: { lessons: true }
                }
            }
        });

        if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

        const allLessonIds = course.modules.flatMap(m => m.lessons.map(l => l.id));
        const totalLessons = allLessonIds.length;

        const studentStats = await Promise.all(enrollments.map(async (enrol) => {
            const progress = await prisma.lessonProgress.findMany({
                where: { userId: enrol.userId, lessonId: { in: allLessonIds }, completed: true }
            });

            const completedCount = progress.length;
            const isCompleted = totalLessons > 0 && completedCount === totalLessons;

            // Calculate time taken if completed
            let timeTakenMinutes = 0;
            if (isCompleted && progress.length > 0) {
                const start = progress.reduce((min, p) => p.startedAt < min ? p.startedAt : min, progress[0].startedAt);
                const end = progress.reduce((max, p) => (p.completedAt || new Date()) > max ? (p.completedAt || new Date()) : max, progress[0].completedAt || new Date());
                timeTakenMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
            }

            return {
                userId: enrol.userId,
                name: enrol.user.name,
                email: enrol.user.email,
                completedCount,
                totalLessons,
                isCompleted,
                percentage: totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0,
                timeTakenMinutes,
                enrolledAt: enrol.createdAt
            };
        }));

        const completions = studentStats.filter(s => s.isCompleted);
        const avgTime = completions.length > 0
            ? Math.round(completions.reduce((acc, s) => acc + s.timeTakenMinutes, 0) / completions.length)
            : 0;

        return NextResponse.json({
            courseTitle: course.title,
            totalEnrollments: enrollments.length,
            totalCompletions: completions.length,
            averageCompletionTimeMinutes: avgTime,
            studentStats
        });
    } catch (e) {
        console.error('[COURSE_STATS_GET]', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
