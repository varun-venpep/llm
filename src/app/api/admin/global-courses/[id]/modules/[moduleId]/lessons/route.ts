import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string; moduleId: string }> };

// POST add a lesson to a module within a global course
export async function POST(req: NextRequest, { params }: Params) {
    const { moduleId } = await params;
    try {
        const { title, content, type, videoUrl, pdfUrl, isActive, resources } = await req.json();
        const lastLesson = await prisma.lesson.findFirst({
            where: { moduleId },
            orderBy: { order: 'desc' }
        });
        const lesson = await prisma.lesson.create({
            data: {
                title,
                content: content || null,
                videoUrl: videoUrl || null,
                pdfUrl: pdfUrl || null,
                type: type || 'TEXT',
                isActive: isActive !== false,
                moduleId,
                order: (lastLesson?.order ?? 0) + 1,
                ...(resources && resources.length > 0 && {
                    resources: {
                        create: resources.map((r: any) => ({
                            name: r.name,
                            url: r.url,
                            type: r.type,
                            size: r.size
                        }))
                    }
                })
            }
        });
        return NextResponse.json(lesson, { status: 201 });
    } catch (e) {
        console.error('Failed to create lesson:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT update a lesson
export async function PUT(req: NextRequest, { params }: Params) {
    const { moduleId } = await params;
    try {
        const { lessonId, title, content, videoUrl, pdfUrl, isActive, type, quiz, resources } = await req.json();
        
        // Sync resources if provided
        if (resources) {
            await prisma.resource.deleteMany({ where: { lessonId } });
        }

        const lesson = await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                ...(title && { title }),
                content: content ?? undefined,
                videoUrl: videoUrl ?? undefined,
                pdfUrl: pdfUrl ?? undefined,
                type: type ?? undefined,
                isActive: isActive !== undefined ? isActive : undefined,
                ...(quiz && {
                    quiz: {
                        upsert: {
                            create: {
                                title: quiz.title,
                                description: quiz.description,
                                passingScore: quiz.passingScore,
                                questions: {
                                    create: quiz.questions.map((q: any, idx: number) => ({
                                        text: q.text,
                                        type: q.type,
                                        order: idx,
                                        options: {
                                            create: q.options.map((o: any) => ({
                                                text: o.text,
                                                isCorrect: o.isCorrect
                                            }))
                                        }
                                    }))
                                }
                            },
                            update: {
                                title: quiz.title,
                                description: quiz.description,
                                passingScore: quiz.passingScore,
                                questions: {
                                    deleteMany: {},
                                    create: quiz.questions.map((q: any, idx: number) => ({
                                        text: q.text,
                                        type: q.type,
                                        order: idx,
                                        options: {
                                            create: q.options.map((o: any) => ({
                                                text: o.text,
                                                isCorrect: o.isCorrect
                                            }))
                                        }
                                    }))
                                }
                            }
                        }
                    }
                }),
                ...(resources && {
                    resources: {
                        create: resources.map((r: any) => ({
                            name: r.name,
                            url: r.url,
                            type: r.type,
                            size: r.size
                        }))
                    }
                })
            }
        });
        return NextResponse.json(lesson);
    } catch (e) {
        console.error('Failed to update lesson:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE a lesson
export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const { lessonId } = await req.json();
        await prisma.lesson.delete({ where: { id: lessonId } });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
