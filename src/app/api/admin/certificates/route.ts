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
        return NextResponse.json({ error: 'Failed to create global template' }, { status: 500 });
    }
}
