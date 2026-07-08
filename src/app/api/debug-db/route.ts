import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const action = searchParams.get('action');
        const lessonId = searchParams.get('lessonId');
        const courseId = searchParams.get('courseId');

        if (action === 'inspect') {
            const courses = await prisma.course.findMany({
                include: {
                    modules: {
                        include: {
                            lessons: {
                                include: {
                                    _count: { select: { progress: true } },
                                    quiz: { include: { _count: { select: { attempts: true } } } }
                                }
                            }
                        }
                    }
                }
            });
            return NextResponse.json({ courses });
        }

        if (action === 'delete-lesson' && lessonId) {
            try {
                // Try deleting lesson directly and catch the database error
                const deleted = await prisma.lesson.delete({
                    where: { id: lessonId }
                });
                return NextResponse.json({ success: true, deleted });
            } catch (err: any) {
                console.error("Database Delete Lesson Error:", err);
                return NextResponse.json({
                    success: false,
                    error: err.message,
                    code: err.code,
                    meta: err.meta
                }, { status: 500 });
            }
        }

        if (action === 'sync-course' && courseId) {
            const domain = searchParams.get('domain') || 'pounraj';
            try {
                const tenant = await prisma.tenant.findUnique({ where: { subdomain: domain } });
                if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

                const localCourse = await prisma.course.findFirst({
                    where: { id: courseId, tenantId: tenant.id }
                });
                if (!localCourse) return NextResponse.json({ error: 'Local course not found' }, { status: 404 });
                if (!localCourse.clonedFromId) return NextResponse.json({ error: 'Not a cloned course' }, { status: 400 });

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
                if (!sourceCourse) return NextResponse.json({ error: 'Global source course not found' }, { status: 404 });

                const result = await prisma.$transaction(async (tx) => {
                    for (const globalModule of sourceCourse.modules) {
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

                        for (const globalLesson of globalModule.lessons) {
                            let localLesson = await tx.lesson.findFirst({
                                            where: { moduleId: localModule.id, title: globalLesson.title }
                            });

                            if (!localLesson) {
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
                                await tx.lesson.update({
                                    where: { id: localLesson.id },
                                    data: {
                                        content: globalLesson.content,
                                        videoUrl: globalLesson.videoUrl,
                                        pdfUrl: globalLesson.pdfUrl,
                                        type: globalLesson.type
                                    }
                                });
                            }
                        }
                    }

                    return await tx.course.findFirst({
                        where: { id: localCourse.id },
                        include: {
                            modules: {
                                include: {
                                    lessons: true
                                }
                            }
                        }
                    });
                });

                return NextResponse.json({ success: true, course: result });
            } catch (err: any) {
                return NextResponse.json({ success: false, error: err.message }, { status: 500 });
            }
        }

        return NextResponse.json({ message: 'No action specified' });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
