import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT update lastPosition for a lesson
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    try {
        const { userId, lessonId, position } = await req.json();

        if (!userId || !lessonId || position === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Upsert progress to update lastPosition
        const progress = await prisma.lessonProgress.upsert({
            where: { userId_lessonId: { userId, lessonId } },
            create: {
                userId,
                lessonId,
                lastPosition: String(position),
                startedAt: new Date()
            },
            update: {
                lastPosition: String(position)
            }
        });

        // Also ensure enrollment exists (self-healing)
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { module: true }
        });

        if (lesson) {
            await prisma.enrollment.upsert({
                where: { userId_courseId: { userId, courseId: lesson.module.courseId } },
                create: { userId, courseId: lesson.module.courseId },
                update: {}
            });
        }

        return NextResponse.json(progress);
    } catch (e) {
        console.error("Failed to update position:", e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
