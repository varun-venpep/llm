import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

async function main() {
    const connectionString = process.env.DATABASE_URL || "postgresql://sowndarkumar@localhost:5432/sowndarkumar";
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });
    
    try {
        const tenants = await prisma.tenant.findMany();
        console.log("--- TENANTS ---");
        tenants.forEach(t => console.log(`ID: ${t.id} | Name: ${t.name} | Subdomain: ${t.subdomain}`));

        const users = await prisma.user.findMany({
            include: { tenant: true }
        });
        console.log("\n--- USERS ---");
        users.forEach(u => {
            console.log(`ID: ${u.id} | Email: ${u.email} | Role: ${u.role} | Tenant: ${u.tenant?.subdomain || 'SUPER_ADMIN'}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
