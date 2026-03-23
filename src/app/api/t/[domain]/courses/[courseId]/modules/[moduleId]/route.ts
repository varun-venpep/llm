import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT update a module
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string; courseId: string; moduleId: string }> }
) {
    const { moduleId } = await params;
    try {
        const { title, order, isActive } = await req.json();
        const updatedModule = await prisma.module.update({
            where: { id: moduleId },
            data: {
                title,
                order,
                isActive: isActive !== undefined ? isActive : true
            }
        });
        return NextResponse.json(updatedModule);
    } catch (e) {
        console.error('[MODULE_PUT]', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE a module
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string; courseId: string; moduleId: string }> }
) {
    const { moduleId } = await params;
    try {
        // Check if any lesson in this module has student progress or quiz attempts
        const moduleWithProgress = await prisma.module.findUnique({
            where: { id: moduleId },
            include: {
                lessons: {
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
                }
            }
        });

        if (!moduleWithProgress) {
            return NextResponse.json({ error: 'Module not found' }, { status: 404 });
        }

        const hasProgress = moduleWithProgress.lessons.some((l: any) => 
            l._count.progress > 0 || (l.quiz && l.quiz._count.attempts > 0)
        );

        if (hasProgress) {
            return NextResponse.json({ 
                error: 'Cannot delete module with student progress. Please deactivate it instead.',
                code: 'HAS_PROGRESS' 
            }, { status: 409 });
        }

        await prisma.module.delete({
            where: { id: moduleId }
        });
        return new NextResponse(null, { status: 204 });
    } catch (e) {
        console.error('[MODULE_DELETE]', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
