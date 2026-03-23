import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all courses for a tenant
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    const { domain } = await params;
    try {
        const tenant = await prisma.tenant.findUnique({ where: { subdomain: domain } });
        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        const { searchParams } = new URL(req.url);
        const view = searchParams.get('view');
        
        const courses = await prisma.course.findMany({
            where: { 
                tenantId: tenant.id,
                ...(view === 'student' ? { isPublished: true } : {}) 
            },
            include: {
                modules: {
                    include: { lessons: true },
                    orderBy: { order: 'asc' }
                },
                _count: { select: { enrollments: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(courses);
    } catch (e) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST create a new course
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    const { domain } = await params;
    try {
        const { title, description, thumbnail, skillLevel, languages, captions } = await req.json();
        const tenant = await prisma.tenant.findUnique({ where: { subdomain: domain } });
        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        const course = await prisma.course.create({
            data: { title, description, thumbnail, skillLevel, languages, captions, tenantId: tenant.id }
        });
        return NextResponse.json(course, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
