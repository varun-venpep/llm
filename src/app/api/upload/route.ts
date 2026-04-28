import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { uploadToS3, getPresignedUrl } from '@/lib/s3';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const presign = formData.get('presign') === 'true';
        const tenantId = formData.get('tenantId') as string || 'system';
        const courseId = formData.get('courseId') as string || 'misc';
        const fileName = formData.get('fileName') as string;
        const contentType = formData.get('contentType') as string;

        if (presign) {
            if (!fileName || !contentType) {
                return NextResponse.json({ error: 'fileName and contentType are required for presigning.' }, { status: 400 });
            }

            const uniqueSuffix = crypto.randomBytes(8).toString('hex');
            const parts = fileName.split('.');
            const ext = parts.length > 1 ? parts.pop() : '';
            const base = parts.join('.').replace(/[^a-zA-Z0-9_-]/g, '_');
            const newFilename = ext ? `${base}_${uniqueSuffix}.${ext}` : `${base}_${uniqueSuffix}`;

            const data = await getPresignedUrl({
                tenantId,
                courseId,
                fileName: newFilename,
                contentType
            });

            return NextResponse.json({
                success: true,
                presigned: true,
                ...data,
                originalName: fileName
            });
        }

        const file = formData.get('file') as File;
        if (!file) {
            return NextResponse.json({ error: 'No file received.' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uniqueSuffix = crypto.randomBytes(8).toString('hex');
        const originalNameParts = file.name.split('.');
        const extension = originalNameParts.length > 1 ? originalNameParts.pop() : '';
        const baseName = originalNameParts.join('.').replace(/[^a-zA-Z0-9_-]/g, '_');
        const newFilename = extension ? `${baseName}_${uniqueSuffix}.${extension}` : `${baseName}_${uniqueSuffix}`;

        const s3Url = await uploadToS3({
            file: buffer,
            tenantId,
            courseId,
            fileName: newFilename
        });

        return NextResponse.json({
            success: true,
            url: s3Url,
            name: file.name,
            size: file.size,
            type: file.type
        });

    } catch (error: any) {
        console.error("Upload error:", error);
        if (error.message?.includes('payload too large') || error.status === 413) {
            return NextResponse.json({ error: 'File is too large for direct upload. Standard limit is 6MB. Please use the presigned upload flow.' }, { status: 413 });
        }
        return NextResponse.json({ error: 'Upload failed: ' + (error.message || 'Unknown error') }, { status: 500 });
    }
}
