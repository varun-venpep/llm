import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file received.' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate a unique filename to prevent collisions
        const uniqueSuffix = crypto.randomBytes(8).toString('hex');
        const extension = file.name.split('.').pop();
        const newFilename = `${uniqueSuffix}.${extension}`;

        // Ensure the upload directory exists
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (err: any) {
            if (err.code !== 'EEXIST') throw err;
        }

        const path = join(uploadDir, newFilename);
        await writeFile(path, buffer);

        // Return the public URL path
        return NextResponse.json({
            success: true,
            url: `/uploads/${newFilename}`,
            name: file.name,
            size: file.size,
            type: file.type
        });

    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
