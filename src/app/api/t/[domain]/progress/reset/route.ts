import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ domain: string }> }
) {
    try {
        const { domain } = await context.params;
        const { userId, courseId } = await req.json();

        if (!userId || !courseId) {
            return new NextResponse('Missing required fields', { status: 400 });
        }

        // Delete all lesson progress for this user and course
        // First get all lesson IDs for this course
        const lessons = await prisma.lesson.findMany({
            where: {
                module: {
                    courseId: courseId
                }
            },
            select: { id: true }
        });

        const lessonIds = lessons.map(l => l.id);

        // Delete progress
        await (prisma as any).lessonProgress.deleteMany({
            where: {
                userId: userId,
                lessonId: { in: lessonIds }
            }
        });

        // Delete quiz attempts for this course's quizzes
        const quizzes = await prisma.quiz.findMany({
            where: {
                lesson: {
                    module: {
                        courseId: courseId
                    }
                }
            },
            select: { id: true }
        });

        const quizIds = quizzes.map(q => q.id);

        await (prisma as any).quizAttempt.deleteMany({
            where: {
                userId: userId,
                quizId: { in: quizIds }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[PROGRESS_RESET_POST]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
