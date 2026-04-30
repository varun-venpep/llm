import nodemailer from 'nodemailer';

/**
 * Real Email Service using Nodemailer
 * 
 * To use this, add these to your .env:
 * - SMTP_HOST (e.g. smtp.gmail.com)
 * - SMTP_PORT (e.g. 587)
 * - SMTP_USER (your email)
 * - SMTP_PASS (your app password)
 * - SMTP_FROM (sender email)
 */

export async function sendEmailNotification(to: string, subject: string, bodyHTML: string) {
    const previewLink = bodyHTML.match(/href="([^"]+)"/)?.[1] || null;

    // 1. Always log to terminal for local debugging
    console.log('\n' + '='.repeat(50));
    console.log('--- [EMAIL DISPATCHED] ---');
    console.log('To:      ', to);
    console.log('Subject: ', subject);
    console.log('='.repeat(50) + '\n');
    if (previewLink) {
        console.log('LINK: ', previewLink);
    }

    // 2. If SMTP is configured, send real mail
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: process.env.SMTP_PORT === '465',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            await transporter.sendMail({
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to,
                subject,
                html: bodyHTML,
            });
            console.log('[Nodemailer] Real email sent successfully.');
            return { sent: true, previewLink };
        } catch (error) {
            console.error('[Nodemailer] Failed to send real email:', error);
            return {
                sent: false,
                previewLink,
                error: error instanceof Error ? error.message : 'SMTP delivery failed',
            };
        }
    }

    console.log('[Nodemailer] SMTP not configured. Printing link to terminal only.');
    return { sent: false, previewLink, error: 'SMTP is not configured' };
}

export async function sendPushNotification(userId: string, title: string, message: string) {
    console.log(`[SNS Mock] Sending push to User ${userId}: ${title} - ${message}`);
    return true;
}

export async function notifyCourseCompletion(userEmail: string, courseTitle: string) {
    const subject = `Congratulations on completing ${courseTitle}!`;
    const body = `<h1>Great job!</h1><p>You have successfully completed ${courseTitle}. Check your dashboard to download your certificate.</p>`;
    await sendEmailNotification(userEmail, subject, body);
}
