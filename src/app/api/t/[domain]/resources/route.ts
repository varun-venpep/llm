import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    const { domain } = await params;
    try {
        const body = await req.json();
        const { name, url, type, size, lessonId, moduleId, courseId } = body;

        const tenant = await prisma.tenant.findUnique({ where: { subdomain: domain } });
        if (!tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const resource = await prisma.resource.create({
            data: {
                name,
                url,
                type,
                size,
                lessonId,
                moduleId,
                courseId
            }
        });

        return NextResponse.json(resource);
    } catch (e) {
        console.error('Resource create error:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
