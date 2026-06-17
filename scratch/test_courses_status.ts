import { prisma } from '../src/lib/prisma';

async function test() {
    try {
        const tenant = await prisma.tenant.findFirst({
            where: { subdomain: 'test' }
        });
        if (!tenant) throw new Error("Tenant 'test' not found");

        const user = await prisma.user.findFirst({
            where: { tenantId: tenant.id }
        });
        if (!user) throw new Error("No user found");

        // Fetch user's completed lessons in tenant
        const userProgress = await prisma.lessonProgress.findMany({
            where: {
                userId: user.id,
                completed: true,
                lesson: {
                    module: {
                        course: {
                            tenantId: tenant.id
                        }
                    }
                }
            },
            select: {
                lessonId: true
            }
        });
        const completedLessonIds = new Set(userProgress.map(p => p.lessonId));
        console.log("Completed lesson IDs found:", Array.from(completedLessonIds));

        // Fetch tenant courses
        const courses = await prisma.course.findMany({
            where: { tenantId: tenant.id },
            include: {
                modules: {
                    include: { lessons: true }
                }
            }
        });

        const coursesWithStatus = courses.map(course => {
            const allLessons = course.modules.flatMap(m => m.lessons.filter(l => l.isActive));
            const totalLessons = allLessons.length;
            
            if (totalLessons === 0) {
                return { title: course.title, status: 'NEW', progressPercentage: 0 };
            }

            const completedCount = allLessons.filter(l => completedLessonIds.has(l.id)).length;
            const progressPercentage = Math.round((completedCount / totalLessons) * 100);

            let status = 'NEW';
            if (completedCount > 0) {
                status = completedCount === totalLessons ? 'COMPLETED' : 'IN_PROGRESS';
            }

            return {
                title: course.title,
                status,
                progressPercentage
            };
        });

        console.log("Processed Courses:", coursesWithStatus);

    } catch (e: any) {
        console.error("TEST FAILED:", e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
