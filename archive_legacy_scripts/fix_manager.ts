import { prisma } from './src/lib/prisma.ts';

async function checkAndAssign() {
    try {
        const tenant = await prisma.tenant.findUnique({ where: { subdomain: 'venpep' } });
        if (!tenant) return console.log('Tenant not found');

        const teams = await prisma.team.findMany({
            where: { tenantId: tenant.id },
            include: { manager: true }
        });

        console.log('Current Teams in venpep:');
        teams.forEach(t => {
            console.log(`- Team: ${t.name}, Manager: ${t.manager?.email || 'None'}`);
        });

        const david = await prisma.user.findFirst({
            where: { email: 'david@venpep.com', tenantId: tenant.id }
        });

        if (david && teams.length > 0) {
            console.log(`Assigning David (${david.id}) as manager for Team: ${teams[0].name}`);
            await prisma.team.update({
                where: { id: teams[0].id },
                data: { managerId: david.id }
            });
            console.log('Success!');
        } else {
            console.log('David not found or no teams exist.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkAndAssign();
