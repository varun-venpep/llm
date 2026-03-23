import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET single course
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string; courseId: string }> }
) {
    const { domain, courseId } = await params;
    try {
        const tenant = await prisma.tenant.findUnique({ where: { subdomain: domain } });
        if (!tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const course = await prisma.course.findFirst({
            where: { id: courseId, tenantId: tenant.id },
            include: {
                resources: true,
                _count: { select: { enrollments: true } },
                modules: {
                    include: {
                        resources: true,
                        lessons: {
                            include: {
                                resources: true,
                                quiz: {
                                    include: {
                                        questions: {
                                            include: { options: true },
                                            orderBy: { order: 'asc' } as any
                                        }
                                    }
                                }
                            },
                            orderBy: { order: 'asc' }
                        }
                    },
                    orderBy: { order: 'asc' }
                }
            }
        });
        if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

        // Backward compatibility: If a lesson is missing videoUrl or pdfUrl but has resources, populate them
        const processedCourse = {
            ...course,
            modules: course.modules.map(mod => ({
                ...mod,
                lessons: mod.lessons.map(lesson => {
                    let { videoUrl, pdfUrl } = lesson;
                    const lessonResources = (lesson as any).resources || [];
                    if (!videoUrl && lesson.type === 'VIDEO' && lessonResources.some((r: any) => r.type === 'VIDEO')) {
                        videoUrl = lessonResources.find((r: any) => r.type === 'VIDEO')?.url || '';
                    }
                    if (!pdfUrl && lesson.type === 'PPT' && lessonResources.some((r: any) => r.type === 'DOCUMENT')) {
                        pdfUrl = lessonResources.find((r: any) => r.type === 'DOCUMENT')?.url || '';
                    }
                    return { ...lesson, videoUrl, pdfUrl };
                })
            }))
        };

        return NextResponse.json(processedCourse);
    } catch (e) {
        console.error('Course GET error:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT update course
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string; courseId: string }> }
) {
    const { domain, courseId } = await params;
    try {
        const body = await req.json();
        const tenant = await prisma.tenant.findUnique({ where: { subdomain: domain } });
        if (!tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const course = await prisma.course.update({
            where: { id: courseId },
            data: {
                title: body.title,
                description: body.description,
                thumbnail: body.thumbnail,
                skillLevel: body.skillLevel,
                languages: body.languages,
                captions: body.captions,
                isPublished: body.isPublished
            }
        });
        return NextResponse.json(course);
    } catch (e) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE course
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string; courseId: string }> }
) {
    const { domain, courseId } = await params;
    try {
        const tenant = await prisma.tenant.findUnique({ where: { subdomain: domain } });
        if (!tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const course = await prisma.course.findFirst({
            where: { id: courseId, tenantId: tenant.id },
            include: { _count: { select: { enrollments: true } } }
        });
        if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

        // Business rule: courses with enrolled students cannot be deleted.
        // They can only be unpublished/deactivated.
        if (course._count.enrollments > 0) {
            return NextResponse.json(
                { error: 'Cannot delete a course that has enrolled students. Please unpublish it instead.' },
                { status: 409 }
            );
        }

        await prisma.course.delete({ where: { id: courseId } });
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('Course delete error:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

