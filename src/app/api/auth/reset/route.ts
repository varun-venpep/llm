import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sendEmailNotification } from '@/lib/notifications';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, email, token, newPassword } = body;
        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        const domain = typeof body.domain === 'string' ? body.domain.trim().toLowerCase() : '';
        const scope = domain ? 'tenant-admin' : 'unsupported';

        // 1. REQUEST RESET LINK
        if (action === 'request') {
            if (!normalizedEmail) {
                return NextResponse.json({ error: 'Email is required' }, { status: 400 });
            }

            if (scope !== 'tenant-admin') {
                return NextResponse.json({ error: 'Password reset is only available for tenant administrators.' }, { status: 403 });
            }

            const tenant = await prisma.tenant.findFirst({
                where: { subdomain: { equals: domain, mode: 'insensitive' } },
                select: { id: true, name: true, subdomain: true }
            });

            if (!tenant) {
                return NextResponse.json({ success: true, message: 'If an eligible account exists, a reset link has been sent.' });
            }

            const user = await prisma.user.findFirst({
                where: {
                    email: normalizedEmail,
                    tenantId: tenant.id
                },
                include: {
                    tenant: { select: { subdomain: true, name: true } }
                }
            });

            if (!user) {
                // Return success for security
                return NextResponse.json({ success: true, message: 'If an eligible account exists, a reset link has been sent.' });
            }

            if (scope === 'tenant-admin' && user.role !== 'TENANT_ADMIN') {
                // For learners, notify the tenant admin
                const tenantAdmin = await prisma.user.findFirst({
                    where: { tenantId: tenant.id, role: 'TENANT_ADMIN' },
                    select: { email: true }
                });

                if (tenantAdmin) {
                    await sendEmailNotification(
                        tenantAdmin.email,
                        'Password Reset Request from Learner',
                        `<h1>Password Reset Request</h1>
                         <p>Learner <strong>${normalizedEmail}</strong> has requested password reset help for workspace <strong>${tenant.name}</strong>.</p>
                         <p>Please assist them with resetting their password or provide access instructions.</p>
                         <p>You can reset their password through the admin panel or contact them directly.</p>`
                    );
                }

                return NextResponse.json({
                    success: true,
                    learnerRequest: true,
                    message: 'Your request has been sent to your workspace admin. They will assist you with password reset.'
                });
            }

            // Generate secure token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

            await prisma.user.update({
                where: { id: user.id },
                data: { resetCode: resetToken, resetExpires }
            });

            // Construct Link on the main app host so tenant subdomain middleware does not rewrite /auth/reset.
            const host = req.headers.get('host');
            const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
            const origin = process.env.NEXT_PUBLIC_APP_URL || (host ? `${protocol}://${host}` : '');
            const returnTo = user.role === 'TENANT_ADMIN' && user.tenant?.subdomain
                ? `/t/${user.tenant.subdomain}/login`
                : '/admin/login';
            const resetLink = `${origin}/auth/reset?token=${resetToken}&email=${encodeURIComponent(normalizedEmail)}&returnTo=${encodeURIComponent(returnTo)}`;

            const delivery = await sendEmailNotification(
                normalizedEmail,
                'Reset Your Password',
                `<h1>Password Reset</h1>
                 <p>You requested to reset your password. Click the link below to continue:</p>
                 <p><a href="${resetLink}" style="padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
                 <p>If you did not request this, please ignore this email.</p>
                 <p>This link expires in 1 hour.</p>`
            );

            if (!delivery.sent && process.env.NODE_ENV === 'production') {
                return NextResponse.json({ error: 'Could not send reset email. Please contact platform support.' }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                message: delivery.sent ? 'Reset link sent to your email.' : 'Reset link generated. SMTP is not configured, so use the development link below.',
                devResetLink: delivery.sent ? undefined : delivery.previewLink,
            });
        }

        // 2. RESET PASSWORD VIA TOKEN
        if (action === 'reset') {
            if (!normalizedEmail || !token || !newPassword) {
                return NextResponse.json({ error: 'Email, token, and new password are required' }, { status: 400 });
            }

            const user = await prisma.user.findFirst({
                where: {
                    email: normalizedEmail,
                    resetCode: token,
                    resetExpires: { gt: new Date() }
                }
            });

            if (!user) {
                return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 });
            }

            // Ensure only tenant admins can reset passwords
            if (user.role !== 'TENANT_ADMIN') {
                return NextResponse.json({ error: 'Password reset is only available for tenant administrators' }, { status: 403 });
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
