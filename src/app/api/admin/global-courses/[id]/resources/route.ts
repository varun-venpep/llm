import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadToS3 } from '@/lib/s3';
import crypto from 'crypto';

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
        const contentType = req.headers.get('content-type') || '';
        let name, url, type, size;

        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData();
            const file = formData.get('file') as File;
            if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const uniqueSuffix = crypto.randomBytes(8).toString('hex');
            const originalNameParts = file.name.split('.');
            const extension = originalNameParts.length > 1 ? originalNameParts.pop() : '';
            const baseName = originalNameParts.join('.').replace(/[^a-zA-Z0-9_-]/g, '_');
            const newFilename = extension ? `${baseName}_${uniqueSuffix}.${extension}` : `${baseName}_${uniqueSuffix}`;

            // Upload to S3 (categorized under system/courseId)
            url = await uploadToS3({
                file: buffer,
                tenantId: 'system',
                courseId: id,
                fileName: newFilename
            });
            name = file.name;
            size = file.size;
            type = file.type.startsWith('image/') ? 'IMAGE' : file.type.startsWith('video/') ? 'VIDEO' : 'DOCUMENT';
        } else {
            const body = await req.json();
            name = body.name;
            url = body.url;
            type = body.type;
            size = body.size;
        }
        
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

        return NextResponse.json(resource, { status: 201 });
    } catch (e: any) {
        console.error('Global resource create error:', e);
        return NextResponse.json({ error: 'Failed to add resource: ' + e.message }, { status: 500 });
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
