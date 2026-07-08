import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const ensureCourseCreateCountColumn = async () => {
    try {
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "Course"
            ADD COLUMN IF NOT EXISTS "courseCreateCount" INTEGER NOT NULL DEFAULT 0
        `);
    } catch (e) {
        console.error('Error ensuring courseCreateCount column on Course:', e);
    }
};

// GET all global courses (Super Admin view)
export async function GET() {
    try {
        await ensureCourseCreateCountColumn();
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

        const coursesWithLimit = await Promise.all(courses.map(async (course) => {
            const courseData = await prisma.$queryRawUnsafe<{ courseCreateCount: number }[]>(
                'SELECT "courseCreateCount" FROM "Course" WHERE "id" = $1 LIMIT 1',
                course.id
            );
            return {
                ...course,
                courseCreateCount: courseData[0]?.courseCreateCount || 0
            };
        }));

        return NextResponse.json(coursesWithLimit);
    } catch (e) {
        console.error('Failed to fetch global courses:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST create a new global course
export async function POST(req: NextRequest) {
    try {
        await ensureCourseCreateCountColumn();
        const { title, description, thumbnail, skillLevel, languages, captions, courseCreateCount } = await req.json();

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

        if (courseCreateCount !== undefined) {
            await prisma.$executeRawUnsafe(
                'UPDATE "Course" SET "courseCreateCount" = $1 WHERE "id" = $2',
                parseInt(String(courseCreateCount), 10),
                course.id
            );
        }

        return NextResponse.json({
            ...course,
            courseCreateCount: courseCreateCount !== undefined ? parseInt(String(courseCreateCount), 10) : 0
        }, { status: 201 });
    } catch (e) {
        console.error('Failed to create global course:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
