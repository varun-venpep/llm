import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { transcribeMedia } from '@/lib/ai';

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ domain: string; courseId: string; moduleId: string; lessonId: string }> }
) {
    try {
        const { domain, courseId, moduleId, lessonId } = await context.params;
        const tenant = await prisma.tenant.findUnique({ where: { subdomain: domain } });
        if (!tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const body = await req.json();
        const { title, content, videoUrl, pdfUrl, type, isActive, resources } = body;

        let transcript = undefined;
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

        const updateData: any = {
            title,
            content,
            videoUrl,
            pdfUrl,
            type,
            ...(transcript !== undefined && { transcript }),
            isActive: typeof isActive === 'boolean' ? isActive : undefined
        };

        if (resources && Array.isArray(resources)) {
            // Drop existing resources and recreate
            await prisma.resource.deleteMany({
                where: { lessonId }
            });
            updateData.resources = {
                create: resources.map(r => ({
                    name: r.name,
                    url: r.url,
                    type: r.type,
                    size: r.size || 0
                }))
            };
        }

        const lesson = await prisma.lesson.update({
            where: { id: lessonId },
            data: updateData,
            include: { resources: true }
        });

        // Trigger AI Video Transcription in background if videoUrl changed and type is VIDEO
        if (videoUrl && type === 'VIDEO') {
            setTimeout(() => {
                transcribeMedia(lesson.id, videoUrl);
            }, 0);
        }

        return NextResponse.json(lesson);
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ domain: string; courseId: string; moduleId: string; lessonId: string }> }
) {
    const { domain, courseId, moduleId, lessonId } = await context.params;
    try {
        console.log(`[DELETE Lesson] domain: ${domain}, courseId: ${courseId}, moduleId: ${moduleId}, lessonId: ${lessonId}`);
        
        const tenant = await prisma.tenant.findUnique({ where: { subdomain: domain } });
        if (!tenant) {
            console.error(`[DELETE Lesson] Tenant not found: ${domain}`);
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        // Check for student progress or quiz attempts
        const lessonWithProgress = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                _count: {
                    select: {
                        progress: true
                    }
                },
                quiz: {
                    include: {
                        _count: {
                            select: {
                                attempts: true
                            }
                        }
                    }
                }
            }
        });

        if (lessonWithProgress) {
            const hasProgress = lessonWithProgress._count.progress > 0 || 
                               (lessonWithProgress.quiz && lessonWithProgress.quiz._count.attempts > 0);
            
            if (hasProgress) {
                return NextResponse.json({ 
                    error: 'Cannot delete lesson with student progress. Please deactivate it instead.',
                    code: 'HAS_PROGRESS'
                }, { status: 409 });
            }
        }

        const deleted = await prisma.lesson.delete({
            where: { id: lessonId }
        });
        
        console.log(`[DELETE Lesson] Successfully deleted lesson: ${lessonId}`);
        return NextResponse.json({ success: true, deleted });
    } catch (error: any) {
        console.error(`[DELETE Lesson] Error deleting lesson ${lessonId}:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
