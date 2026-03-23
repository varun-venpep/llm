import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ domain: string; courseId: string; moduleId: string; lessonId: string }> }
) {
    try {
        const { lessonId } = await context.params;
        const quiz = await prisma.quiz.findUnique({
            where: { lessonId },
            include: {
                questions: {
                    include: { options: true },
                    orderBy: { order: 'asc' } as any
                }
            }
        });
        return NextResponse.json(quiz);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ domain: string; courseId: string; moduleId: string; lessonId: string }> }
) {
    try {
        const { lessonId } = await context.params;
        const body = await req.json();
        const { title, description, passingScore, retakeAllowed, maxAttempts, isRandomized, randomCount, questions } = body;

        const result = await prisma.$transaction(async (tx) => {
            const quiz = await tx.quiz.upsert({
                where: { lessonId },
                update: { 
                    title, 
                    description, 
                    passingScore: parseInt(passingScore) || 70,
                    retakeAllowed: !!retakeAllowed,
                    maxAttempts: parseInt(maxAttempts) || 0,
                    isRandomized: !!isRandomized,
                    randomCount: parseInt(randomCount) || 0
                },
                create: { 
                    title, 
                    description, 
                    passingScore: parseInt(passingScore) || 70, 
                    lessonId,
                    retakeAllowed: !!retakeAllowed,
                    maxAttempts: parseInt(maxAttempts) || 0,
                    isRandomized: !!isRandomized,
                    randomCount: parseInt(randomCount) || 0
                }
            });

            // Clean up existing questions
            await tx.question.deleteMany({ where: { quizId: quiz.id } });

            if (questions && Array.isArray(questions)) {
                for (let i = 0; i < questions.length; i++) {
                    const q = questions[i];
                    await tx.question.create({
                        data: {
                            quizId: quiz.id,
                            text: q.text,
                            type: q.type || 'MULTIPLE_CHOICE',
                            order: i + 1,
                            options: {
                                create: q.options.map((o: any) => ({
                                    text: o.text,
                                    isCorrect: !!o.isCorrect
                                }))
                            }
                        }
                    });
                }
            }
            return tx.quiz.findUnique({
                where: { id: quiz.id },
                include: { questions: { include: { options: true } } }
            });
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Quiz creation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
