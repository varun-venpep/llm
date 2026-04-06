import { prisma } from './src/lib/prisma.ts';

async function test() {
    try {
        const learners = await prisma.user.findMany({
            where: {
                tenant: { subdomain: 'venpep' },
                role: 'LEARNER',
            },
            include: {
                jobRoles: { select: { id: true, name: true } },
                teams: { select: { id: true, name: true } }
            }
        });
        console.log("Learners count:", learners.length);
    } catch(e) { console.error("Prisma Error:", e); }
    finally { await prisma.$disconnect(); }
}
test();
