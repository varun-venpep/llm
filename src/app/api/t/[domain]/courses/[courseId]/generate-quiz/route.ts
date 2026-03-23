import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateLocalQuizQuestions } from '@/lib/quiz-generator';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string; courseId: string }> }
) {
    const { domain, courseId } = await params;
    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get('lessonId');

    try {
        const tenant = await prisma.tenant.findUnique({ where: { subdomain: domain } });
        if (!tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Aggregate context for local generation
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                modules: {
                    include: {
                        lessons: true
                    }
                }
            }
        });

        if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

        let fullContext = "";
        
        if (lessonId) {
            const lesson = await prisma.lesson.findUnique({
                where: { id: lessonId }
            });
            if (lesson) {
                fullContext += `Lesson: ${lesson.title}\n`;
                if (lesson.content) fullContext += `${lesson.content}\n`;
                if (lesson.transcript) fullContext += `Transcript: ${lesson.transcript}\n`;
            }
        } else {
            // Course metadata
            fullContext += `Title: ${course.title}\nDescription: ${course.description}\n\n`;

            // All lesson content
            for (const mod of course.modules) {
                fullContext += `Module: ${mod.title}\n`;
                for (const lesson of mod.lessons) {
                    fullContext += `Lesson: ${lesson.title}\n`;
                    if (lesson.content) fullContext += `${lesson.content}\n`;
                    if (lesson.transcript) fullContext += `Transcript: ${lesson.transcript}\n`;
                }
                fullContext += "\n";
            }
        }

        if (lessonId && fullContext.trim().length < 50) {
            // If lesson context is too short, add course/module context as fallback
            fullContext += `Title: ${course.title}\nDescription: ${course.description}\n\n`;
            for (const mod of course.modules) {
                if (mod.lessons.some(l => l.id === lessonId)) {
                    fullContext += `Targeting Module: ${mod.title}\n`;
                    for (const l of mod.lessons) {
                        if (l.id !== lessonId) {
                            fullContext += `Related Lesson: ${l.title}\n`;
                            if (l.content) fullContext += `${l.content}\n`;
                            if (l.transcript) fullContext += `Transcript: ${l.transcript}\n`;
                        }
                    }
                }
            }
        }

        if (fullContext.trim().length < 50) {
            return NextResponse.json({ error: 'Not enough content to generate a quiz. Please add more lesson descriptions or transcripts in this module.' }, { status: 400 });
        }

        const body = await req.json().catch(() => ({}));
        const requestedCount = parseInt(body.count) || 5;

        // Generate questions using LOCAL rule-based generator
        const questions = await generateLocalQuizQuestions(fullContext, requestedCount);

        return NextResponse.json({ questions });
    } catch (e: any) {
        console.error('Quiz generation error:', e);
        return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
    }
}
