import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const users = await prisma.user.findMany();
    const tenants = await prisma.tenant.findMany();
    console.log("Users:", users.map(u => ({ email: u.email, role: u.role, tenantId: u.tenantId })));
    console.log("Tenants:", tenants.map(t => ({ id: t.id, subdomain: t.subdomain, name: t.name })));
}
main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
