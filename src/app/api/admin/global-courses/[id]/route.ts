import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

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

// GET a single global course with full details
export async function GET(req: NextRequest, { params }: Params) {
    const { id } = await params;
    try {
        await ensureCourseCreateCountColumn();
        const course = await prisma.course.findFirst({
            where: { id, isGlobal: true },
            include: {
                resources: true,
                modules: {
                    include: {
                        resources: true,
                        lessons: {
                            include: { 
                                quiz: { include: { questions: { include: { options: true } } } },
                                resources: true
                            },
                            orderBy: { order: 'asc' }
                        }
                    },
                    orderBy: { order: 'asc' }
                },
                _count: { select: { marketplaceClaims: true } }
            }
        });
        if (!course) return NextResponse.json({ error: 'Global course not found' }, { status: 404 });

        const courseData = await prisma.$queryRawUnsafe<{ courseCreateCount: number }[]>(
            'SELECT "courseCreateCount" FROM "Course" WHERE "id" = $1 LIMIT 1',
            course.id
        );

        return NextResponse.json({
            ...course,
            courseCreateCount: courseData[0]?.courseCreateCount || 0
        });
    } catch (e) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT update a global course
export async function PUT(req: NextRequest, { params }: Params) {
    const { id } = await params;
    try {
        await ensureCourseCreateCountColumn();
        const { title, description, thumbnail, skillLevel, languages, captions, isPublished, courseCreateCount } = await req.json();
        const course = await prisma.course.update({
            where: { id },
            data: {
                ...(title && { title }),
                description: description ?? undefined,
                thumbnail: thumbnail ?? undefined,
                ...(skillLevel && { skillLevel }),
                ...(languages && { languages }),
                ...(captions !== undefined && { captions }),
                ...(isPublished !== undefined && { isPublished })
            }
        });

        if (courseCreateCount !== undefined) {
            await prisma.$executeRawUnsafe(
                'UPDATE "Course" SET "courseCreateCount" = $1 WHERE "id" = $2',
                parseInt(String(courseCreateCount), 10),
                id
            );
        }

        return NextResponse.json({
            ...course,
            courseCreateCount: courseCreateCount !== undefined ? parseInt(String(courseCreateCount), 10) : 0
        });
    } catch (e) {
        console.error('Failed to update global course:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE a global course
export async function DELETE(req: NextRequest, { params }: Params) {
    const { id } = await params;
    try {
        // Safety: cannot delete if it has been claimed
        const claimCount = await prisma.marketplaceClaim.count({ where: { sourceCourseId: id } });
        if (claimCount > 0) {
            return NextResponse.json(
                { error: `Cannot delete: this course has been claimed by ${claimCount} workspace(s). Unpublish it instead.` },
                { status: 400 }
            );
        }
        await prisma.course.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('Failed to delete global course:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
