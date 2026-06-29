import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkSession, requireTenantPermission } from '@/lib/auth';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string; courseId: string }> }
) {
    const { domain, courseId } = await params;
    try {
        const session = await checkSession(req, domain, ['TENANT_ADMIN', 'SUPER_ADMIN']);
        if (!session || !requireTenantPermission(session, 'courses.manage')) {
            return NextResponse.json({ error: 'You do not have permission to sync courses' }, { status: 403 });
        }

        const tenant = await prisma.tenant.findUnique({ where: { subdomain: domain } });
        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        const localCourse = await prisma.course.findFirst({
            where: { id: courseId, tenantId: tenant.id }
        });
        if (!localCourse) return NextResponse.json({ error: 'Local course not found' }, { status: 404 });
        if (!localCourse.clonedFromId) {
            return NextResponse.json({ error: 'This course was not cloned from a global course and cannot be synced' }, { status: 400 });
        }

        const sourceCourse = await prisma.course.findFirst({
            where: { id: localCourse.clonedFromId, isGlobal: true, isPublished: true },
            include: {
                modules: {
                    include: {
                        lessons: {
                            include: {
                                quiz: {
                                    include: {
                                        questions: { include: { options: true } }
                                    }
                                }
                            },
                            orderBy: { order: 'asc' }
                        }
                    },
                    orderBy: { order: 'asc' }
                }
            }
        });
        if (!sourceCourse) {
            return NextResponse.json({ error: 'Original global course not found or not published' }, { status: 404 });
        }

        // Perform synchronization within a transaction
        const updatedCourse = await prisma.$transaction(async (tx) => {
            // For each module in the source global course
            for (const globalModule of sourceCourse.modules) {
                // Find matching module in local course
                let localModule = await tx.module.findFirst({
                    where: { courseId: localCourse.id, title: globalModule.title }
                });
                if (!localModule) {
                    localModule = await tx.module.create({
                        data: {
                            title: globalModule.title,
                            order: globalModule.order,
                            courseId: localCourse.id
                        }
                    });
                }

                // For each lesson in the global module
                for (const globalLesson of globalModule.lessons) {
                    let localLesson = await tx.lesson.findFirst({
                        where: { moduleId: localModule.id, title: globalLesson.title }
                    });

                    if (!localLesson) {
                        // Create new lesson
                        localLesson = await tx.lesson.create({
                            data: {
                                title: globalLesson.title,
                                content: globalLesson.content,
                                videoUrl: globalLesson.videoUrl,
                                pdfUrl: globalLesson.pdfUrl,
                                type: globalLesson.type,
                                order: globalLesson.order,
                                moduleId: localModule.id,
                                isActive: globalLesson.isActive
                            }
                        });

                        // Clone quiz if exists
                        if (globalLesson.quiz) {
                            const clonedQuiz = await tx.quiz.create({
                                data: {
                                    title: globalLesson.quiz.title,
                                    description: globalLesson.quiz.description,
                                    passingScore: globalLesson.quiz.passingScore,
                                    isRandomized: globalLesson.quiz.isRandomized,
                                    maxAttempts: globalLesson.quiz.maxAttempts,
                                    retakeAllowed: globalLesson.quiz.retakeAllowed,
                                    lessonId: localLesson.id
                                }
                            });

                            for (const question of globalLesson.quiz.questions) {
                                const clonedQuestion = await tx.question.create({
                                    data: {
                                        text: question.text,
                                        type: question.type,
                                        order: question.order,
                                        quizId: clonedQuiz.id
                                    }
                                });

                                for (const option of question.options) {
                                    await tx.option.create({
                                        data: {
                                            text: option.text,
                                            isCorrect: option.isCorrect,
                                            questionId: clonedQuestion.id
                                        }
                                    });
                                }
                            }
                        }
                    } else {
                        // Update existing lesson fields (but preserve active status/progress of local users)
                        await tx.lesson.update({
                            where: { id: localLesson.id },
                            data: {
                                content: globalLesson.content,
                                videoUrl: globalLesson.videoUrl,
                                pdfUrl: globalLesson.pdfUrl,
                                type: globalLesson.type
                            }
                        });

                        // Sync quiz if it exists in the global course and is missing locally
                        if (globalLesson.quiz) {
                            const localQuiz = await tx.quiz.findUnique({
                                where: { lessonId: localLesson.id }
                            });
                            if (!localQuiz) {
                                const clonedQuiz = await tx.quiz.create({
                                    data: {
                                        title: globalLesson.quiz.title,
                                        description: globalLesson.quiz.description,
                                        passingScore: globalLesson.quiz.passingScore,
                                        isRandomized: globalLesson.quiz.isRandomized,
                                        maxAttempts: globalLesson.quiz.maxAttempts,
                                        retakeAllowed: globalLesson.quiz.retakeAllowed,
                                        lessonId: localLesson.id
                                    }
                                });

                                for (const question of globalLesson.quiz.questions) {
                                    const clonedQuestion = await tx.question.create({
                                        data: {
                                            text: question.text,
                                            type: question.type,
                                            order: question.order,
                                            quizId: clonedQuiz.id
                                        }
                                    });

                                    for (const option of question.options) {
                                        await tx.option.create({
                                            data: {
                                                text: option.text,
                                                isCorrect: option.isCorrect,
                                                questionId: clonedQuestion.id
                                            }
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Retrieve updated local course structure
            return await tx.course.findFirst({
                where: { id: localCourse.id },
                include: {
                    resources: true,
                    _count: { select: { enrollments: true } },
                    modules: {
                        include: {
                            resources: true,
                            lessons: {
                                include: {
                                    resources: true,
                                    quiz: {
                                        include: {
                                            questions: {
                                                include: { options: true },
                                                orderBy: { order: 'asc' } as any
                                            }
                                        }
                                    }
                                },
                                orderBy: { order: 'asc' }
                            }
                        },
                        orderBy: { order: 'asc' }
                    }
                }
            });
        });

        // Add Audit Log
        if (session) {
            await prisma.activityLog.create({
                data: {
                    userId: session.id,
                    action: 'COURSE_SYNCED_WITH_GLOBAL',
                    metadata: { courseId: courseId, title: localCourse.title }
                }
            });
        }

        // Backward compatibility preprocessing similar to GET
        const processedCourse = {
            ...updatedCourse,
            modules: updatedCourse?.modules.map(mod => ({
                ...mod,
                lessons: mod.lessons.map(lesson => {
                    let { videoUrl, pdfUrl } = lesson;
                    const lessonResources = (lesson as any).resources || [];
                    if (!videoUrl && lesson.type === 'VIDEO' && lessonResources.some((r: any) => r.type === 'VIDEO')) {
                        videoUrl = lessonResources.find((r: any) => r.type === 'VIDEO')?.url || '';
                    }
                    if (!pdfUrl && lesson.type === 'PPT' && lessonResources.some((r: any) => r.type === 'DOCUMENT')) {
                        pdfUrl = lessonResources.find((r: any) => r.type === 'DOCUMENT')?.url || '';
                    }
                    return { ...lesson, videoUrl, pdfUrl };
                })
            }))
        };

        return NextResponse.json({ success: true, course: processedCourse }, { status: 200 });
    } catch (e) {
        console.error('Failed to sync course:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
