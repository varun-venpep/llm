import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password, rememberMe } = body;

        // The super admin user doesn't belong to a tenant.
        const user = await prisma.user.findFirst({
            where: {
                email,
                role: 'SUPER_ADMIN'
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
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
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
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
}
