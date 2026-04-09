import { prisma } from './src/lib/prisma.ts';

async function check() {
    try {
        const learners = await prisma.user.findMany({
            where: {
                tenant: { subdomain: 'venpep' },
                role: 'LEARNER',
            },
            include: {
                jobRoles: { select: { id: true, name: true } },
                teams: { select: { id: true, name: true } },
                enrollments: {
                    include: {
                        course: {
                            select: {
                                id: true,
                                title: true,
                                modules: {
                                    where: { isActive: true },
                                    include: {
                                        lessons: {
                                            where: { isActive: true },
                                            select: { id: true }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                progress: true,
                quizAttempts: {
                    include: {
                        quiz: {
                            select: {
                                title: true,
                                passingScore: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                activityLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 50
                }
            },
            orderBy: { createdAt: 'desc' },
        });
        console.log("Success, count:", learners.length);
    } catch(e) { console.error("Error:", e.message); }
    finally { await prisma.$disconnect(); }
}
check();
