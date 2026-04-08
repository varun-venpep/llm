import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Super Admin Global Certificates Management
export async function GET() {
    try {
        const templates = await prisma.certificateTemplate.findMany({
            where: { isGlobal: true },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(templates);
    } catch (error) {
        console.error("Global certificates fetch error:", error);
        return NextResponse.json({ error: 'Failed to fetch global templates' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { name, backgroundImage } = await req.json();

        if (!name || !backgroundImage) {
            return NextResponse.json({ error: 'Name and background image are required' }, { status: 400 });
        }

        const template = await prisma.certificateTemplate.create({
            data: {
                name,
                backgroundImage,
                isGlobal: true,
                designFields: {} // Initial empty design
            }
        });

        return NextResponse.json(template);
    } catch (error) {
        console.error("Global certificate creation error:", error);
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
        }

        // Ensure we only delete global templates via this admin endpoint
        await prisma.certificateTemplate.delete({
            where: { 
                id,
                isGlobal: true 
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Global certificate deletion error:", error);
        return NextResponse.json({ 
            error: 'Failed to delete global template',
            details: error?.message || String(error)
        }, { status: 500 });
    }
}
