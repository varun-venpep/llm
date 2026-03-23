import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET progress for a user in a specific course
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    const { domain } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');

    if (!userId || !courseId) {
        return NextResponse.json({ error: 'userId and courseId required' }, { status: 400 });
    }

    try {
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                modules: {
                    where: { isActive: true },
                    include: { 
                        lessons: {
                            where: { isActive: true }
                        }
                    }
                }
            }
        });
        if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

        const allLessonIds = course.modules.flatMap(m => m.lessons.map(l => l.id));
        const allProgress = await prisma.lessonProgress.findMany({
            where: { userId, lessonId: { in: allLessonIds } }
        });
        
        const completedProgress = allProgress.filter(p => p.completed);

        const totalLessons = allLessonIds.length;
        const completedCount = completedProgress.length;
        const percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

        const completedLessonIds = completedProgress.map((p: { lessonId: string }) => p.lessonId);
        
        // Return a map of lessonId -> progress stats
        const progressMap = allProgress.reduce((acc, p) => {
            acc[p.lessonId] = {
                completed: p.completed,
                lastPosition: p.lastPosition
            };
            return acc;
        }, {} as Record<string, any>);

        // 3. Self-healing: If there's progress but no enrollment record, create it.
        // This handles cases where old data exists or auto-enrollment failed.
        if (completedCount > 0) {
            await prisma.enrollment.upsert({
                where: { userId_courseId: { userId, courseId } },
                create: { userId, courseId, status: 'ACTIVE' },
                update: {}
            });
        }

        return NextResponse.json({ percentage, completedLessonIds, progressMap, totalLessons, completedCount });
    } catch (e) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST mark a lesson as complete
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    try {
        const { userId, lessonId, completed } = await req.json();

        // 1. Ensure the user is actually enrolled in the database
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { module: true }
        });

        if (lesson) {
            await prisma.enrollment.upsert({
                where: { userId_courseId: { userId, courseId: lesson.module.courseId } },
                create: { userId, courseId: lesson.module.courseId },
                update: {} // Do nothing if already enrolled
            });
        }

        // 2. Track lesson progress
        const progress = await prisma.lessonProgress.upsert({
            where: { userId_lessonId: { userId, lessonId } },
            create: {
                userId,
                lessonId,
                completed,
                startedAt: new Date(),
                completedAt: completed ? new Date() : null
            },
            update: {
                completed,
                completedAt: completed ? new Date() : (undefined as any) // Don't clear if marking as start
            }
        });
        return NextResponse.json(progress);
    } catch (e) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
