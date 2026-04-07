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

        const allLessonIds = course.modules.flatMap((m: any) => m.lessons.map((l: any) => l.id));
        const allProgress = await prisma.lessonProgress.findMany({
            where: { userId, lessonId: { in: allLessonIds } }
        });
        
        const completedProgress = allProgress.filter((p: any) => p.completed);

        const totalLessons = allLessonIds.length;
        const completedCount = completedProgress.length;
        const percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

        const completedLessonIds = completedProgress.map((p: { lessonId: string }) => p.lessonId);
        
        // Return a map of lessonId -> progress stats
        const progressMap = allProgress.reduce((acc: any, p: any) => {
            acc[p.lessonId] = {
                completed: p.completed,
                lastPosition: p.lastPosition
            };
            return acc;
        }, {} as Record<string, any>);

        // 3. Self-healing: If there's no enrollment record, create it.
        // This handles auto-enrollment as soon as a learner accesses the course.
        await prisma.enrollment.upsert({
            where: { userId_courseId: { userId, courseId } },
            create: { userId, courseId, status: 'ACTIVE' },
            update: {}
        });

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
        const { domain } = await params;
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
                completedAt: completed ? new Date() : (undefined as any)
            }
        });

        // 3. Automated Certificate Engine (Phase 4)
        if (completed && lesson) {
            const courseId = lesson.module.courseId;
            const course = await prisma.course.findUnique({
                where: { id: courseId },
                include: {
                    modules: {
                        where: { isActive: true },
                        include: { lessons: { where: { isActive: true } } }
                    }
                }
            });

            if (course && course.certificateEnabled) {
                const allLessonIds = course.modules.flatMap((m: any) => m.lessons.map((l: any) => l.id));
                const totalLessons = allLessonIds.length;
                
                if (totalLessons > 0) {
                    const completedProgress = await prisma.lessonProgress.count({
                        where: { userId, lessonId: { in: allLessonIds }, completed: true }
                    });
                    
                    // Check for 100% completion
                    if (completedProgress >= totalLessons) {
                        const existingCert = await prisma.issuedCertificate.findFirst({
                            where: { userId, courseId }
                        });

                        if (!existingCert) {
                            const uniqueCode = `CERT-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
                            await prisma.issuedCertificate.create({
                                data: {
                                    uniqueCode,
                                    userId,
                                    courseId,
                                    certificateUrl: `/api/t/${domain}/certificates/view?userId=${userId}&courseId=${courseId}`
                                }
                            });
                        }
                    }
                }
            }
        }

        return NextResponse.json({ ...progress });
    } catch (e) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
