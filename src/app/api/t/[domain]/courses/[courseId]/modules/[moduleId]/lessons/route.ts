import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { transcribeMedia } from '@/lib/ai';

// GET lessons in a module
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ moduleId: string }> }
) {
    const { moduleId } = await params;
    try {
        const lessons = await prisma.lesson.findMany({
            where: { moduleId },
            include: { resources: true },
            orderBy: { order: 'asc' }
        });
        return NextResponse.json(lessons);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST create a lesson
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ moduleId: string }> }
) {
    const { moduleId } = await params;
    try {
        const { title, content, videoUrl, pdfUrl, type = 'TEXT', isActive = true, resources = [] } = await req.json();
        const count = await prisma.lesson.count({ where: { moduleId } });

        let transcript = null;
        if (pdfUrl && type === 'PPT') {
            try {
                const pdfParseModule = (await import('pdf-parse'));
                const pdfParse = (pdfParseModule as any).default || pdfParseModule;
                const pdfRes = await fetch(pdfUrl);
                if (pdfRes.ok) {
                    const arrayBuffer = await pdfRes.arrayBuffer();
                    const data = await pdfParse(Buffer.from(arrayBuffer));
                    transcript = data.text;
                }
            } catch (err) {
                console.error("Failed to parse PDF transcript:", err);
            }
        }

        const lesson = await prisma.lesson.create({
            data: {
                title, content, videoUrl, pdfUrl, transcript, moduleId, type, isActive, order: count + 1,
                resources: {
                    create: resources.map((r: any) => ({
                        name: r.name,
                        url: r.url,
                        type: r.type,
                        size: r.size
                    }))
                }
            },
            include: { resources: true }
        });

        // Trigger AI Video Transcription in background if URL is provided and type is VIDEO
        if (videoUrl && type === 'VIDEO') {
            setTimeout(() => {
                transcribeMedia(lesson.id, videoUrl);
            }, 0);
        }

        return NextResponse.json(lesson, { status: 201 });
    } catch (e) {
        console.error("Lesson POST Error:", e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
