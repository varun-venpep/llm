import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/t/[domain]/lessons/[lessonId]/transcript-status
 *
 * Returns the current transcriptStatus for a lesson.
 * Used by the Tenant Admin UI to poll for status updates.
 */
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ domain: string; lessonId: string }> }
) {
    const { lessonId } = await context.params;
    try {
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            select: { transcriptStatus: true, hasCaptions: true }
        });
        if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(lesson);
    } catch (e) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
