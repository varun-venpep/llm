/**
 * Seed script for test tenant:
 * - Adds a global certificate template (BUG-013)
 * - Publishes draft courses for the 'test' tenant (BUG-008)
 *
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-test-data.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // ── BUG-013: Seed a global certificate template ──────────────────────────
    console.log('Seeding global certificate template...');
    const existing = await prisma.certificateTemplate.findFirst({
        where: { isGlobal: true, name: 'Professional Achievement' }
    });

    if (!existing) {
        await prisma.certificateTemplate.create({
            data: {
                name: 'Professional Achievement',
                backgroundImage: '/placeholder-cert.svg',
                isGlobal: true,
                designFields: {
                    fields: [
                        {
                            id: 'title',
                            type: 'text',
                            x: 50,
                            y: 38,
                            fontSize: 32,
                            fontFamily: 'Georgia',
                            color: '#1a1a2e',
                            content: 'Certificate of Achievement',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            width: 500
                        },
                        {
                            id: 'recipient',
                            type: 'text',
                            x: 50,
                            y: 50,
                            fontSize: 24,
                            fontFamily: 'Georgia',
                            color: '#4f46e5',
                            content: '{{learnerName}}',
                            fontWeight: 'normal',
                            textAlign: 'center',
                            width: 500
                        },
                        {
                            id: 'course',
                            type: 'text',
                            x: 50,
                            y: 62,
                            fontSize: 16,
                            fontFamily: 'Arial',
                            color: '#666666',
                            content: 'for completing {{courseName}}',
                            fontWeight: 'normal',
                            textAlign: 'center',
                            width: 500
                        },
                        {
                            id: 'date',
                            type: 'text',
                            x: 50,
                            y: 80,
                            fontSize: 12,
                            fontFamily: 'Arial',
                            color: '#999999',
                            content: '{{completionDate}}',
                            fontWeight: 'normal',
                            textAlign: 'center',
                            width: 300
                        }
                    ]
                }
            }
        });
        console.log('✅ Global certificate template created: Professional Achievement');
    } else {
        console.log('ℹ️  Global certificate template already exists, skipping.');
    }

    // ── BUG-008: Publish draft courses for 'test' tenant ────────────────────
    console.log('Publishing draft courses for test tenant...');
    const testTenant = await prisma.tenant.findUnique({
        where: { subdomain: 'test' }
    });

    if (!testTenant) {
        console.log('⚠️  No tenant with subdomain "test" found. Skipping course publishing.');
        return;
    }

    const draftCourses = await prisma.course.findMany({
        where: {
            tenantId: testTenant.id,
            isPublished: false
        }
    });

    if (draftCourses.length === 0) {
        console.log('ℹ️  No draft courses found for test tenant.');
    } else {
        // Publish only the first draft course as a demo
        const firstDraft = draftCourses[0];
        await prisma.course.update({
            where: { id: firstDraft.id },
            data: { isPublished: true }
        });
        console.log(`✅ Published course: "${firstDraft.title}"`);
    }

    console.log('\n🎉 Test data seed complete!');
}

main()
    .then(async () => { await prisma.$disconnect(); })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
