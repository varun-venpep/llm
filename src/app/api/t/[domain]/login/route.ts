import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { checkRateLimit, resetRateLimit } from '@/lib/rateLimit';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    try {
        const { domain } = await params;

        // BUG-002: Rate limit by IP — max 10 attempts per 15 minutes
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
        const rateLimitKey = `login:${domain}:${ip}`;
        const { allowed, resetAt } = checkRateLimit(rateLimitKey, { max: 10, windowMs: 15 * 60 * 1000 });

        if (!allowed) {
            const retryAfterSeconds = Math.ceil((resetAt - Date.now()) / 1000);
            return NextResponse.json(
                { error: `Too many failed login attempts. Please try again in ${Math.ceil(retryAfterSeconds / 60)} minute(s).` },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(retryAfterSeconds),
                        'X-RateLimit-Remaining': '0',
                    }
                }
            );
        }

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

        // Successful login — clear rate limit counter for this IP
        resetRateLimit(rateLimitKey);

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

        // Audit Log: User Login
        await prisma.activityLog.create({
            data: {
                userId: user.id,
                action: 'USER_LOGIN',
                metadata: {
                    ip: req.headers.get('x-forwarded-for') || 'unknown',
                    userAgent: req.headers.get('user-agent') || 'unknown'
                }
            }
        });

        return response;

    } catch (error: any) {
        console.error('[Login API Error]:', error);
        return NextResponse.json({ error: 'Login failed', details: error.message }, { status: 500 });
    }
}
