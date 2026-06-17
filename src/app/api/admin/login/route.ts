import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { password, rememberMe } = body;
        const email = body.email?.toLowerCase();

        // Platform staff (SUPER_ADMIN and PLATFORM_MANAGER) are linked to the system-level tenant
        const user = await prisma.user.findFirst({
            where: {
                email,
                role: { in: ['SUPER_ADMIN', 'PLATFORM_MANAGER'] }
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                password: true
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
        }

        const response = NextResponse.json({
            success: true,
            message: 'Login successful',
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            token: user.id
        });

        // Set session cookie for auth persistence
        const cookieOptions: any = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        };

        if (rememberMe) {
            cookieOptions.maxAge = 60 * 60 * 24 * 7; // 1 week
        }

        response.cookies.set('session-token', user.id, cookieOptions);
        return response;

    } catch (error) {
        console.error('CRITICAL LOGIN ERROR:', error);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
}
