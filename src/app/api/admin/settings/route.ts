import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const settings = await prisma.platformSetting.findMany();
        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to retrieve settings' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { key, value } = await req.json();
        
        const setting = await prisma.platformSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });

        return NextResponse.json(setting);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
    }
}
