import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkSession, requireTenantPermission } from '@/lib/auth';

// PUT update a module
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string; courseId: string; moduleId: string }> }
) {
    const { domain, moduleId } = await params;
    try {
        const session = await checkSession(req, domain, ['TENANT_ADMIN', 'SUPER_ADMIN']);
        if (!session || !requireTenantPermission(session, 'courses.manage')) {
            return NextResponse.json({ error: 'You do not have permission to update modules' }, { status: 403 });
        }

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
    const { domain, moduleId } = await params;
    try {
        const session = await checkSession(req, domain, ['TENANT_ADMIN', 'SUPER_ADMIN']);
        if (!session || !requireTenantPermission(session, 'courses.manage')) {
            return NextResponse.json({ error: 'You do not have permission to delete modules' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const force = searchParams.get('force') === 'true';

        // Check if any lesson in this module has learner progress or quiz attempts
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

        if (!force) {
            const hasProgress = moduleWithProgress.lessons.some((l: any) => 
                l._count.progress > 0 || (l.quiz && l.quiz._count.attempts > 0)
            );

            if (hasProgress) {
                return NextResponse.json({ 
                    error: 'Cannot delete module with learner progress. Please deactivate it instead.',
                    code: 'HAS_PROGRESS' 
                }, { status: 409 });
            }
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
