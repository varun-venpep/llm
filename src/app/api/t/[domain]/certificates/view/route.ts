import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    const { domain } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');
    const code = searchParams.get('code'); // Unique verification code

    try {
        const cert = await prisma.issuedCertificate.findFirst({
            where: {
                ...(code ? { uniqueCode: code } : { userId: userId || '', courseId: courseId || '' })
            },
            include: {
                user: { select: { name: true } },
                course: { 
                    select: { 
                        title: true, 
                        certificateTemplate: true 
                    } 
                }
            }
        });

        if (!cert || !cert.course.certificateTemplate) {
            return new NextResponse('Certificate not found or not configured.', { status: 404 });
        }

        const template = cert.course.certificateTemplate;
        const design = template.designFields as any;
        const fields = design?.fields || [];

        // Substitutions
        const substitutions: Record<string, string> = {
            '{{Learner Name}}': cert.user.name || 'Achievement Learner',
            '{{Course Title}}': cert.course.title,
            '{{Completion Date}}': new Date(cert.issuedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
            'ID: {{Certificate ID}}': `Verification ID: ${cert.uniqueCode}`,
            '{{Certificate ID}}': cert.uniqueCode
        };

        const renderFields = fields.map((f: any) => {
            let text = f.text;
            Object.entries(substitutions).forEach(([key, val]) => {
                text = text.replace(key, val);
            });

            return `
                <div style="
                    position: absolute;
                    left: ${f.x}%;
                    top: ${f.y}%;
                    transform: translate(${f.alignment === 'center' ? '-50%' : f.alignment === 'right' ? '-100%' : '0'}, -50%);
                    font-size: ${f.fontSize}px;
                    color: ${f.color};
                    font-weight: ${f.fontWeight === 'bold' ? '900' : '400'};
                    text-align: ${f.alignment};
                    white-space: nowrap;
                    font-family: 'Inter', sans-serif;
                ">
                    ${text}
                </div>
            `;
        }).join('');

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
                <style>
                    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
                    .certificate-container {
                        position: relative;
                        width: 100%;
                        aspect-ratio: 1.414 / 1;
                        background-image: url('${template.backgroundImage}');
                        background-size: cover;
                        background-position: center;
                    }
                    @media print {
                        .certificate-container { width: 297mm; height: 210mm; }
                    }
                </style>
            </head>
            <body>
                <div class="certificate-container">
                    ${renderFields}
                </div>
            </body>
            </html>
        `;

        return new NextResponse(html, {
            headers: { 'Content-Type': 'text/html' }
        });

    } catch (e) {
        console.error(e);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
