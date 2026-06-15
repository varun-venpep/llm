import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * DEV-ONLY seed endpoint — creates global cert template + publishes first draft course for 'test' tenant.
 * Call GET http://localhost:3001/api/dev/seed-test-data
 * Remove this file before production deployment.
 */
export async function GET(req: NextRequest) {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    const results: string[] = [];

    // ── Seed global certificate template (BUG-013) ──────────────────────────
    const existingGlobal = await prisma.certificateTemplate.findFirst({
        where: { isGlobal: true }
    });

    if (!existingGlobal) {
        await prisma.certificateTemplate.create({
            data: {
                name: 'Professional Achievement',
                backgroundImage: '/placeholder-cert.svg',
                isGlobal: true,
                designFields: {
                    fields: [
                        { id: 'title', type: 'text', x: 50, y: 38, fontSize: 32, fontFamily: 'Georgia', color: '#1a1a2e', content: 'Certificate of Achievement', fontWeight: 'bold', textAlign: 'center', width: 500 },
                        { id: 'recipient', type: 'text', x: 50, y: 50, fontSize: 24, fontFamily: 'Georgia', color: '#4f46e5', content: '{{learnerName}}', fontWeight: 'normal', textAlign: 'center', width: 500 },
                        { id: 'course', type: 'text', x: 50, y: 62, fontSize: 16, fontFamily: 'Arial', color: '#666666', content: 'for completing {{courseName}}', fontWeight: 'normal', textAlign: 'center', width: 500 },
                        { id: 'date', type: 'text', x: 50, y: 80, fontSize: 12, fontFamily: 'Arial', color: '#999999', content: '{{completionDate}}', fontWeight: 'normal', textAlign: 'center', width: 300 }
                    ]
                }
            }
        });
        results.push('✅ Created global certificate template: Professional Achievement');
    } else {
        results.push(`ℹ️ Global certificate template already exists: ${existingGlobal.name}`);
    }

    // ── Publish first draft course for test tenant (BUG-008) ────────────────
    const testTenant = await prisma.tenant.findUnique({ where: { subdomain: 'test' } });

    if (testTenant) {
        const draftCourse = await prisma.course.findFirst({
            where: { tenantId: testTenant.id, isPublished: false }
        });
        if (draftCourse) {
            await prisma.course.update({
                where: { id: draftCourse.id },
                data: { isPublished: true }
            });
            results.push(`✅ Published course: "${draftCourse.title}"`);
        } else {
            results.push('ℹ️ No draft courses found for test tenant');
        }
    } else {
        results.push('⚠️ No tenant with subdomain "test" found');
    }

    return NextResponse.json({ success: true, results });
}
