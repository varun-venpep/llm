import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET modules for a course
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string; courseId: string }> }
) {
    const { courseId } = await params;
    try {
        const modules = await prisma.module.findMany({
            where: { courseId },
            include: { lessons: { orderBy: { order: 'asc' } } },
            orderBy: { order: 'asc' }
        });
        return NextResponse.json(modules);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST create a module
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string; courseId: string }> }
) {
    const { courseId } = await params;
    try {
        const { title } = await req.json();
        const count = await prisma.module.count({ where: { courseId } });
        const module = await prisma.module.create({
            data: { title, courseId, order: count + 1 }
        });
        return NextResponse.json(module, { status: 201 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
