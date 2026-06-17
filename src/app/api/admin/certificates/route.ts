import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const templates = await prisma.certificateTemplate.findMany({
            where: { isGlobal: true },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(templates);
    } catch {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { name, backgroundImage, designFields } = await req.json();
        if (!name || !backgroundImage) return NextResponse.json({ error: 'Missing values' }, { status: 400 });

        const template = await prisma.certificateTemplate.create({
            data: {
                name,
                backgroundImage,
                isGlobal: true,
                designFields: designFields || {}
            }
        });
        return NextResponse.json(template);
    } catch {
        return NextResponse.json({ error: 'Failed creation' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        await prisma.certificateTemplate.delete({
            where: { id, isGlobal: true }
        });
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Error' }, { status: 500 });
    }
}
