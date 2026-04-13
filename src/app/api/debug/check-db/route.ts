import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
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

        if (!course) return NextResponse.json({ error: 'Course not found' });

        const audit = course.modules.map(mod => ({
            module: mod.title,
            lessons: mod.lessons.map(l => ({
                id: l.id,
                title: l.title,
                type: l.type,
                contentPreview: l.content ? l.content.substring(0, 50) + '...' : 'EMPTY',
                transcriptPreview: l.transcript ? l.transcript.substring(0, 50) + '...' : 'EMPTY',
                status: l.transcriptStatus
            }))
        }));

        return NextResponse.json({ course: course.title, audit });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const course = await prisma.course.findFirst({
            where: { title: 'AI as code Architect' },
            include: { modules: { include: { lessons: true } } }
        });

        if (!course) return NextResponse.json({ error: 'Course not found' });

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

        return NextResponse.json({ success: true, message: "Sample content seeded." });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
