import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sendEmailNotification } from '@/lib/notifications';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, email, token, newPassword, tenantId } = body;

        // 1. REQUEST RESET LINK
        if (action === 'request') {
            const user = await prisma.user.findFirst({
                where: {
                    email: email.toLowerCase(),
                    ...(tenantId ? { tenantId } : {})
                }
            });

            if (!user) {
                // Return success for security
                return NextResponse.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
            }

            // Generate secure token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

            await prisma.user.update({
                where: { id: user.id },
                data: { resetCode: resetToken, resetExpires }
            });

            // Construct Link
            const host = req.headers.get('host');
            const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
            const origin = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_APP_URL;
            const resetLink = `${origin}/auth/reset?token=${resetToken}&email=${encodeURIComponent(email)}`;

            await sendEmailNotification(
                email,
                'Reset Your Password',
                `<h1>Password Reset</h1>
                 <p>You requested to reset your password. Click the link below to continue:</p>
                 <p><a href="${resetLink}" style="padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
                 <p>If you did not request this, please ignore this email.</p>
                 <p>This link expires in 1 hour.</p>`
            );

            return NextResponse.json({ success: true, message: 'Reset link sent to your email.' });
        }

        // 2. RESET PASSWORD VIA TOKEN
        if (action === 'reset') {
            const user = await prisma.user.findFirst({
                where: {
                    email: email.toLowerCase(),
                    resetCode: token,
                    resetExpires: { gt: new Date() }
                }
            });

            if (!user) {
                return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await prisma.user.update({
                where: { id: user.id },
                data: { 
                    password: hashedPassword,
                    resetCode: null,
                    resetExpires: null
                }
            });

            return NextResponse.json({ success: true, message: 'Password updated successfully' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('--- [RESET API ERROR] ---');
        console.error('Error:', error);
        console.error('Full Error:', error);
        console.error('--------------------------');
        return NextResponse.json({ error: 'Unable to process password reset right now. Please contact platform support.' }, { status: 500 });
    }
}
