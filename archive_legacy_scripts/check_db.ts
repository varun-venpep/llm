import { prisma } from './src/lib/prisma.ts';

async function check() {
    try {
        console.log("Tenants:", await prisma.tenant.count());
        console.log("Users:", await prisma.user.count());
        console.log("JobRoles:", await prisma.jobRole.count());
        console.log("Teams:", await prisma.team.count());
    } catch(e) { console.error(e); }
    finally { await prisma.$disconnect(); }
}
check();
