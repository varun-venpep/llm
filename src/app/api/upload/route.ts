import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { uploadToS3, getPresignedUrl } from '@/lib/s3';

function isMissingBucketError(error: unknown) {
    return error instanceof Error && error.message.includes('environment variable is not set');
}

async function saveLocalUpload({
    file,
    tenantId,
    courseId,
    fileName,
}: {
    file: File;
    tenantId: string;
    courseId: string;
    fileName: string;
}) {
    const cleanTenant = tenantId.replace(/[^a-zA-Z0-9_-]/g, '') || 'system';
    const cleanCourse = courseId.replace(/[^a-zA-Z0-9_-]/g, '') || 'misc';
    const relativeDir = path.join('uploads', cleanTenant, cleanCourse);
    const uploadDir = path.join(process.cwd(), 'public', relativeDir);

    await mkdir(uploadDir, { recursive: true });
    const bytes = await file.arrayBuffer();
    await writeFile(path.join(uploadDir, fileName), Buffer.from(bytes));

    return `/${relativeDir.replaceAll(path.sep, '/')}/${fileName}`;
}

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

            try {
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
            } catch (error) {
                if (process.env.NODE_ENV !== 'production' && isMissingBucketError(error)) {
                    return NextResponse.json({
                        success: true,
                        presigned: false,
                        localFallback: true,
                        originalName: fileName,
                    });
                }

                throw error;
            }
        }

        const file = formData.get('file') as File;
        if (!file) {
            return NextResponse.json({ error: 'No file received.' }, { status: 400 });
        }

        const uniqueSuffix = crypto.randomBytes(8).toString('hex');
        const originalNameParts = file.name.split('.');
        const extension = originalNameParts.length > 1 ? originalNameParts.pop() : '';
        const baseName = originalNameParts.join('.').replace(/[^a-zA-Z0-9_-]/g, '_');
        const newFilename = extension ? `${baseName}_${uniqueSuffix}.${extension}` : `${baseName}_${uniqueSuffix}`;

        let uploadedUrl: string;

        try {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            uploadedUrl = await uploadToS3({
                file: buffer,
                tenantId,
                courseId,
                fileName: newFilename
            });
        } catch (error) {
            if (process.env.NODE_ENV !== 'production' && isMissingBucketError(error)) {
                uploadedUrl = await saveLocalUpload({
                    file,
                    tenantId,
                    courseId,
                    fileName: newFilename,
                });
            } else {
                throw error;
            }
        }

        return NextResponse.json({
            success: true,
            url: uploadedUrl,
            name: file.name,
            size: file.size,
            type: file.type
        });

    } catch (error: unknown) {
        console.error("Upload error:", error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        const status = typeof error === 'object' && error !== null && 'status' in error ? (error as { status?: number }).status : undefined;
        if (message.includes('payload too large') || status === 413) {
            return NextResponse.json({ error: 'File is too large for direct upload. Standard limit is 6MB. Please use the presigned upload flow.' }, { status: 413 });
        }
        return NextResponse.json({ error: 'Upload failed: ' + message }, { status: 500 });
    }
}
