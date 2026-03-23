import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ domain: string }> }
) {
    const { domain } = await context.params;
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
        return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    try {
        const reviews = await prisma.review.findMany({
            where: { courseId },
            include: { user: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
        });

        // Calculate average
        const aggregate = await prisma.review.aggregate({
            where: { courseId },
            _avg: { rating: true },
            _count: { id: true }
        });

        return NextResponse.json({
            reviews,
            averageRating: aggregate._avg.rating || 0,
            totalReviews: aggregate._count.id || 0
        });
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
        const { rating, content, userId, courseId } = body;

        if (!userId || !courseId || rating === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const review = await prisma.review.upsert({
            where: {
                userId_courseId: { userId, courseId }
            },
            update: {
                rating: parseInt(rating),
                content
            },
            create: {
                rating: parseInt(rating),
                content,
                userId,
                courseId
            }
        });

        return NextResponse.json(review);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
