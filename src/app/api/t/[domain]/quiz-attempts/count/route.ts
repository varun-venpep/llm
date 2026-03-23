import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ domain: string }> }
) {
    try {
        const { searchParams } = new URL(req.url);
        const quizId = searchParams.get('quizId');
        const userId = searchParams.get('userId');

        if (!quizId || !userId) {
            return NextResponse.json({ error: 'Missing quizId or userId' }, { status: 400 });
        }

        const count = await prisma.quizAttempt.count({
            where: {
                quizId,
                userId
            }
        });

        return NextResponse.json({ count });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
