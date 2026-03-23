import { prisma } from './src/lib/prisma';

async function check() {
    try {
        const students = await prisma.user.findMany({
            where: { role: 'STUDENT' },
            select: { id: true, email: true, name: true }
        });
        console.log('Students:', JSON.stringify(students, null, 2));

        const enrollments = await prisma.enrollment.findMany({
            include: {
                user: { select: { email: true } },
                course: { select: { title: true } }
            }
        });
        console.log('Enrollments:', JSON.stringify(enrollments, null, 2));

        const quizzes = await prisma.quiz.findMany({
            include: {
                questions: {
                    include: { options: true }
                }
            }
        });
        console.log('Quizzes:', JSON.stringify(quizzes, null, 2));

    } catch (error) {
        console.error('Check failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

check();
