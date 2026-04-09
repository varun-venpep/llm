import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

// POST add a module to a global course
export async function POST(req: NextRequest, { params }: Params) {
    const { id: courseId } = await params;
    try {
        const { title } = await req.json();
        const lastModule = await prisma.module.findFirst({
            where: { courseId },
            orderBy: { order: 'desc' }
        });
        const module = await prisma.module.create({
            data: { title, courseId, order: (lastModule?.order ?? 0) + 1 }
        });
        return NextResponse.json(module, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT update a module title
export async function PUT(req: NextRequest, { params }: Params) {
    const { id: courseId } = await params;
    try {
        const { moduleId, title, isActive } = await req.json();
        const module = await prisma.module.update({
            where: { id: moduleId },
            data: { 
                ...(title && { title }),
                ...(isActive !== undefined && { isActive })
            }
        });
        return NextResponse.json(module);
    } catch (e) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE a module
export async function DELETE(req: NextRequest, { params }: Params) {
    const { id: courseId } = await params;
    try {
        const { moduleId } = await req.json();
        await prisma.module.delete({ where: { id: moduleId } });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
