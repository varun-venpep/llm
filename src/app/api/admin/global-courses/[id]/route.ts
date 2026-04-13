import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

// GET a single global course with full details
export async function GET(req: NextRequest, { params }: Params) {
    const { id } = await params;
    try {
        const course = await prisma.course.findFirst({
            where: { id, isGlobal: true },
            include: {
                resources: true,
                modules: {
                    include: {
                        resources: true,
                        lessons: {
                            include: { 
                                quiz: { include: { questions: { include: { options: true } } } },
                                resources: true
                            },
                            orderBy: { order: 'asc' }
                        }
                    },
                    orderBy: { order: 'asc' }
                },
                _count: { select: { marketplaceClaims: true } }
            }
        });
        if (!course) return NextResponse.json({ error: 'Global course not found' }, { status: 404 });
        return NextResponse.json(course);
    } catch (e) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT update a global course
export async function PUT(req: NextRequest, { params }: Params) {
    const { id } = await params;
    try {
        const { title, description, thumbnail, skillLevel, languages, captions, isPublished } = await req.json();
        const course = await prisma.course.update({
            where: { id },
            data: {
                ...(title && { title }),
                description: description ?? undefined,
                thumbnail: thumbnail ?? undefined,
                ...(skillLevel && { skillLevel }),
                ...(languages && { languages }),
                ...(captions !== undefined && { captions }),
                ...(isPublished !== undefined && { isPublished })
            }
        });
        return NextResponse.json(course);
    } catch (e) {
        console.error('Failed to update global course:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE a global course
export async function DELETE(req: NextRequest, { params }: Params) {
    const { id } = await params;
    try {
        // Safety: cannot delete if it has been claimed
        const claimCount = await prisma.marketplaceClaim.count({ where: { sourceCourseId: id } });
        if (claimCount > 0) {
            return NextResponse.json(
                { error: `Cannot delete: this course has been claimed by ${claimCount} workspace(s). Unpublish it instead.` },
                { status: 400 }
            );
        }
        await prisma.course.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('Failed to delete global course:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
