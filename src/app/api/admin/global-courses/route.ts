import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all global courses (Super Admin view)
export async function GET() {
    try {
        const courses = await prisma.course.findMany({
            where: { isGlobal: true },
            include: {
                modules: {
                    include: { lessons: { orderBy: { order: 'asc' } } },
                    orderBy: { order: 'asc' }
                },
                _count: { select: { marketplaceClaims: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(courses);
    } catch (e) {
        console.error('Failed to fetch global courses:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST create a new global course
export async function POST(req: NextRequest) {
    try {
        const { title, description, thumbnail, skillLevel, languages, captions } = await req.json();

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const course = await prisma.course.create({
            data: {
                title: title,
                description: description || null,
                thumbnail: thumbnail || null,
                skillLevel: skillLevel || 'All Levels',
                languages: languages || 'English',
                captions: captions || false,
                isGlobal: true,
                isPublished: false,
                tenantId: null, // Explicitly null for global courses
            }
        });

        return NextResponse.json(course, { status: 201 });
    } catch (e) {
        console.error('Failed to create global course:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
