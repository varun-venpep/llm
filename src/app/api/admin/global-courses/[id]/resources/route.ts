import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

// GET global course resources
export async function GET(req: NextRequest, { params }: Params) {
    const { id } = await params;
    try {
        const resources = await prisma.resource.findMany({
            where: { courseId: id },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(resources);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
    }
}

// POST add a new global course resource
export async function POST(req: NextRequest, { params }: Params) {
    const { id } = await params;
    try {
        const { name, url, type, size } = await req.json();
        
        if (!name || !url || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const resource = await prisma.resource.create({
            data: {
                name,
                url,
                type,
                size: size || null,
                courseId: id
            }
        });

        // Optional: Trigger a notification or audit log
        return NextResponse.json(resource, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to add resource' }, { status: 500 });
    }
}

// DELETE a global course resource is usually in a separate [resId] route, 
// but we'll include it here or create a new one for clarity.
export async function DELETE(req: NextRequest, { params }: Params) {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const resourceId = searchParams.get('resourceId');

    if (!resourceId) return NextResponse.json({ error: 'Resource ID required' }, { status: 400 });

    try {
        await prisma.resource.delete({
            where: { id: resourceId, courseId: id }
        });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 });
    }
}
