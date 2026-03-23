import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ domain: string }> }
) {
    const { domain } = await context.params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');
    const lessonId = searchParams.get('lessonId');

    if (!userId || !courseId) {
        return NextResponse.json({ error: 'userId and courseId are required' }, { status: 400 });
    }

    try {
        const notes = await prisma.note.findMany({
            where: {
                userId,
                courseId,
                ...(lessonId ? { lessonId } : {})
            },
            orderBy: { timestamp: 'asc' }
        });
        return NextResponse.json(notes);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ domain: string }> }
) {
    const { domain } = await context.params;
    try {
        const body = await req.json();
        const { content, timestamp, userId, courseId, lessonId } = body;

        if (!userId || !courseId || !lessonId || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const note = await prisma.note.create({
            data: {
                content,
                timestamp: parseFloat(timestamp) || 0,
                userId,
                courseId,
                lessonId
            }
        });

        return NextResponse.json(note);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ domain: string }> }
) {
    const { domain } = await context.params;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    try {
        await prisma.note.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
