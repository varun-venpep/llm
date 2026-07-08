import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    const { domain } = await params;
    try {
        const { courseId } = await req.json();

        const tenant = await prisma.tenant.findUnique({ where: { subdomain: domain } });
        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        // Check course limit if set
        try {
            await prisma.$executeRawUnsafe(`
                ALTER TABLE "Tenant"
                ADD COLUMN IF NOT EXISTS "courseCreateCount" INTEGER NOT NULL DEFAULT 0
            `);
        } catch (e) {
            console.error('Error ensuring courseCreateCount column in claim route:', e);
        }

        const tenantsData = await prisma.$queryRawUnsafe<{ courseCreateCount: number }[]>(
            'SELECT "courseCreateCount" FROM "Tenant" WHERE "id" = $1 LIMIT 1',
            tenant.id
        );
        const courseCreateCount = tenantsData[0]?.courseCreateCount || 0;

        if (courseCreateCount > 0) {
            const currentCount = await prisma.course.count({ where: { tenantId: tenant.id } });
            if (currentCount >= courseCreateCount) {
                return NextResponse.json({
                    error: "Your course creation limit has been reached. Please upgrade to the next package to continue creating courses."
                }, { status: 403 });
            }
        }

        // Guard 1: Global Marketplace must be enabled (Bypassed for purchase simulation)
        /*
        if (!tenant.globalMarketplaceEnabled) {
            return NextResponse.json({ error: 'Global Marketplace is not enabled for this workspace' }, { status: 403 });
        }
        */

        // Guard 2: Must have course credits (Bypassed for purchase simulation)
        /*
        if (tenant.courseCredits <= 0) {
            return NextResponse.json({ error: 'No course credits remaining. Contact your administrator.' }, { status: 402 });
        }
        */

        // Guard 3: Cannot claim the same course twice
        const existingClaim = await prisma.marketplaceClaim.findUnique({
            where: { tenantId_sourceCourseId: { tenantId: tenant.id, sourceCourseId: courseId } }
        });
        if (existingClaim) {
            return NextResponse.json({ error: 'You have already claimed this course.' }, { status: 409 });
        }

        // Fetch the source global course with all content
        const sourceCourse = await prisma.course.findFirst({
            where: { id: courseId, isGlobal: true, isPublished: true },
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
            return NextResponse.json({ error: 'Global course not found or not published' }, { status: 404 });
        }

        // Deep-clone the course within a transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the new course for this tenant
            const clonedCourse = await tx.course.create({
                data: {
                    title: sourceCourse.title,
                    description: sourceCourse.description,
                    thumbnail: sourceCourse.thumbnail,
                    skillLevel: sourceCourse.skillLevel,
                    languages: sourceCourse.languages,
                    captions: sourceCourse.captions,
                    isPublished: false, // Tenant must review before publishing
                    isMarketplace: false,
                    isGlobal: false,
                    clonedFromId: sourceCourse.id,
                    tenantId: tenant.id
                }
            });

            // 2. Deep-clone all modules and lessons
            for (const module of sourceCourse.modules) {
                const clonedModule = await tx.module.create({
                    data: { title: module.title, order: module.order, courseId: clonedCourse.id }
                });

                for (const lesson of module.lessons) {
                    const clonedLesson = await tx.lesson.create({
                        data: {
                            title: lesson.title,
                            content: lesson.content,
                            videoUrl: lesson.videoUrl,
                            pdfUrl: lesson.pdfUrl,
                            type: lesson.type,
                            order: lesson.order,
                            moduleId: clonedModule.id
                        }
                    });

                    // 3. Clone Quiz if exists
                    if (lesson.quiz) {
                        const clonedQuiz = await tx.quiz.create({
                            data: {
                                title: lesson.quiz.title,
                                description: lesson.quiz.description,
                                passingScore: lesson.quiz.passingScore,
                                isRandomized: lesson.quiz.isRandomized,
                                maxAttempts: lesson.quiz.maxAttempts,
                                retakeAllowed: lesson.quiz.retakeAllowed,
                                lessonId: clonedLesson.id
                            }
                        });

                        for (const question of lesson.quiz.questions) {
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

            // 4. Deduct 1 credit from tenant (if any are left)
            await tx.tenant.update({
                where: { id: tenant.id },
                data: { courseCredits: tenant.courseCredits > 0 ? { decrement: 1 } : tenant.courseCredits }
            });

            // 5. Record the claim
            await tx.marketplaceClaim.create({
                data: {
                    tenantId: tenant.id,
                    courseId: clonedCourse.id,
                    sourceCourseId: sourceCourse.id
                }
            });

            return clonedCourse;
        });

        return NextResponse.json({ success: true, course: result }, { status: 201 });
    } catch (e) {
        console.error('Failed to claim course:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
