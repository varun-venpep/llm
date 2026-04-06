import { prisma } from './src/lib/prisma.ts';

async function migrate() {
    try {
        console.log('Migrating LEARNER role to LEARNER...');
        const result = await prisma.user.updateMany({
            where: { role: 'LEARNER' },
            data: { role: 'LEARNER' }
        });
        console.log(`Successfully migrated ${result.count} users!`);
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
