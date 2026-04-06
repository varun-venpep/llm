import { prisma } from './src/lib/prisma.ts';

async function check() {
    try {
        const users = await prisma.user.findMany({
            include: { teams: { select: { id: true, name: true } }, jobRole: { select: { name: true } } }
        });
        console.log('Users with Teams/Roles:');
        users.forEach(u => {
            console.log(`- ${u.email} [${u.role}]: Teams: ${u.teams.map(t => t.name).join(', ')} | Role: ${u.jobRole?.name || 'None'}`);
        });

        const courses = await prisma.course.findMany({
            include: { exclusiveTeam: true, exclusiveRole: true }
        });
        console.log('\nCourses with Exclusivity:');
        courses.forEach(c => {
            console.log(`- ${c.title}: Team: ${c.exclusiveTeam?.name || 'None'} | Role: ${c.exclusiveRole?.name || 'None'}`);
        });

    } catch (error) {
        console.error('Check failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

check();
