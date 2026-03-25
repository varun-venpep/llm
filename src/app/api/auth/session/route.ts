import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const sessionId = req.cookies.get('session-token')?.value;

        if (!sessionId) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: sessionId },
            select: { id: true, name: true, email: true, role: true }
        });

        if (!user) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        return NextResponse.json({
            authenticated: true,
            user
        });

    } catch (error) {
        return NextResponse.json({ authenticated: false }, { status: 500 });
    }
}
