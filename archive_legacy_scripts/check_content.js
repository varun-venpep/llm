const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkContent() {
    const course = await prisma.course.findFirst({
        where: { title: 'AI as code Architect' },
        include: {
            modules: {
                include: {
                    lessons: true
                }
            }
        }
    });

    if (!course) {
        console.log("Course not found!");
        return;
    }

    console.log(`Course: ${course.title}`);
    course.modules.forEach(mod => {
        console.log(`  Module: ${mod.title}`);
        mod.lessons.forEach(lesson => {
            console.log(`    Lesson: ${lesson.title}`);
            console.log(`      Type: ${lesson.type}`);
            console.log(`      Content length: ${lesson.content?.length || 0}`);
            console.log(`      Transcript length: ${lesson.transcript?.length || 0}`);
            console.log(`      Transcript Status: ${lesson.transcriptStatus}`);
        });
    });
}

checkContent().finally(() => prisma.$disconnect());
