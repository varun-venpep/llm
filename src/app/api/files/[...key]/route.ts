import { NextRequest, NextResponse } from 'next/server';
import { getObjectFromS3, headObjectFromS3 } from '@/lib/s3';

async function streamToBuffer(stream: unknown) {
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ key: string[] }> }
) {
    try {
        const { key } = await params;
        const bucket = req.nextUrl.searchParams.get('bucket');
        const objectKey = key.map(decodeURIComponent).join('/');
        const object = await getObjectFromS3(objectKey, bucket);

        if (!object.Body) {
            return new NextResponse('File not found', { status: 404 });
        }

        const body = await streamToBuffer(object.Body);

        return new NextResponse(body, {
            headers: {
                'Content-Type': object.ContentType || 'application/octet-stream',
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('[File proxy error]:', error);
        const message = error instanceof Error ? error.message : 'Unable to load file';
        return new NextResponse(message, { status: 404 });
    }
}

export async function HEAD(
    req: NextRequest,
    { params }: { params: Promise<{ key: string[] }> }
) {
    try {
        const { key } = await params;
        const bucket = req.nextUrl.searchParams.get('bucket');
        const objectKey = key.map(decodeURIComponent).join('/');
        const object = await headObjectFromS3(objectKey, bucket);

        return new NextResponse(null, {
            headers: {
                'Content-Type': object.ContentType || 'application/octet-stream',
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('[File proxy HEAD error]:', error);
        return new NextResponse(null, { status: 404 });
    }
}
