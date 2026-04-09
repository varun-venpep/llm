import { prisma } from './src/lib/prisma.ts';

async function check() {
    try {
        const roles = await prisma.jobRole.findMany({});
        console.log('Roles:', roles.map(r => ({ name: r.name, isActive: r.isActive })));

        const teams = await prisma.team.findMany({});
        console.log('Teams:', teams.map(t => ({ name: t.name, isActive: t.isActive })));

    } catch (error) {
        console.error('Check failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

check();
