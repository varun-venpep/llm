import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    try {
        const { domain } = await params;
        const body = await req.json();
        const { email, password, rememberMe } = body;

        // Find user by email and tenant subdomain
        const user = await prisma.user.findFirst({
            where: {
                email,
                tenant: { subdomain: domain }
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials or workspace access' }, { status: 401 });
        }

        if (user.isActive === false) {
            return NextResponse.json({ error: 'Your account has been deactivated. Please contact your administrator.' }, { status: 403 });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
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
        return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }
}
