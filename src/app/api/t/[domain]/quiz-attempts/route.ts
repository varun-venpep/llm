import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ domain: string }> }
) {
    try {
        const { quizId, userId, answers } = await req.json();

        // Fetch quiz with questions and options to verify answers
        const quiz = await prisma.quiz.findUnique({
            where: { id: quizId },
            include: {
                questions: {
                    include: {
                        options: true
                    }
                }
            }
        });

        if (!quiz) {
            return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
        }

        // Calculate score on server — handles MULTIPLE_CHOICE, MULTIPLE_SELECT, and FILL_BLANK
        let correctCount = 0;
        const totalAnswered = answers.length;

        answers.forEach((submittedAns: {
            questionId: string;
            optionId?: string;        // MULTIPLE_CHOICE
            optionIds?: string[];     // MULTIPLE_SELECT
            fillAnswer?: string;      // FILL_BLANK
        }) => {
            const question = quiz.questions.find(q => q.id === submittedAns.questionId);
            if (!question) return;

            if (submittedAns.fillAnswer !== undefined) {
                // FILL_BLANK: case-insensitive match against the correct option's text
                const correctOption = question.options.find(o => o.isCorrect);
                if (correctOption && submittedAns.fillAnswer.trim().toLowerCase() === correctOption.text.trim().toLowerCase()) {
                    correctCount++;
                }
            } else if (submittedAns.optionIds !== undefined) {
                // MULTIPLE_SELECT: student must select exactly all correct options, no more, no less
                const correctOptionIds = question.options.filter(o => o.isCorrect).map(o => o.id).sort();
                const submittedSorted = [...submittedAns.optionIds].sort();
                const allCorrect = correctOptionIds.length === submittedSorted.length &&
                    correctOptionIds.every((id, i) => id === submittedSorted[i]);
                if (allCorrect) correctCount++;
            } else if (submittedAns.optionId) {
                // MULTIPLE_CHOICE: single correct option
                const option = question.options.find(o => o.id === submittedAns.optionId);
                if (option?.isCorrect) correctCount++;
            }
        });

        const score = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
        const passed = score >= (quiz.passingScore || 70);

        const attempt = await prisma.quizAttempt.create({
            data: {
                quizId,
                userId,
                score,
                passed,
                answers: answers || {}
            }
        });

        // Auto-mark lesson as complete if passed
        if (passed) {
            await prisma.lessonProgress.upsert({
                where: {
                    userId_lessonId: {
                        userId,
                        lessonId: quiz.lessonId
                    }
                },
                update: {
                    completed: true,
                    completedAt: new Date()
                },
                create: {
                    userId,
                    lessonId: quiz.lessonId,
                    completed: true,
                    completedAt: new Date()
                }
            });
        }

        return NextResponse.json(attempt);
    } catch (error: any) {
        console.error('Quiz attempt error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
