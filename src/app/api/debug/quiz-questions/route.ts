import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get('quizId');
    if (!quizId) return NextResponse.json({ error: 'quizId required' });
    
    const questions = await prisma.question.findMany({
        where: { quizId },
        include: { options: true }
    });
    return NextResponse.json(questions);
}
