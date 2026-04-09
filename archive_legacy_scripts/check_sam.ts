import { prisma } from './src/lib/prisma.ts';

async function check() {
    try {
        const sam = await prisma.user.findFirst({
            where: { email: { contains: 'sam' } },
            include: { managedTeams: true, teams: true }
        });
        console.log('Sam User:', sam?.name, sam?.email);
        console.log('Managed Teams:', sam?.managedTeams.map(t => t.name));
        console.log('Member Teams:', sam?.teams.map(t => t.name));
    } catch(e) { console.error(e); }
    finally { await prisma.$disconnect(); }
}
check();
