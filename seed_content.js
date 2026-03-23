const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addSampleContent() {
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

    for (const mod of course.modules) {
        for (const lesson of mod.lessons) {
            if (lesson.title === 'Learning the basics') {
                await prisma.lesson.update({
                    where: { id: lesson.id },
                    data: {
                        content: "AI in software architecture involves using machine learning models to assist in design decisions. This refers to the integration of generative AI into the development lifecycle. It is important for modern software development because it speeds up the initial prototyping phase.",
                        transcript: "In this lesson, we cover the fundamentals of AI architecture. AI-powered IDEs are changing how we write code. Antigravity is a primary example of this shift. It means developers can focus on high-level logic while the agent handles the boilerplate."
                    }
                });
            } else if (lesson.title === 'Efficient learning') {
                await prisma.lesson.update({
                    where: { id: lesson.id },
                    data: {
                        content: "Efficient learning techniques focus on prompt engineering. This is the primary way to interact with LLMs effectively. It requires crafting specific and clear instructions. Due to the complexity of modern models, high-quality prompts are key to getting high-quality outputs."
                    }
                });
            }
        }
    }
    console.log("Sample content added to lessons.");
}

addSampleContent().finally(() => prisma.$disconnect());
