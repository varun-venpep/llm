import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

async function main() {
    console.log("Starting prisma diagnostic with adapter...");
    const connectionString = process.env.DATABASE_URL || "postgresql:///sowndarkumar";
    console.log("Connection string:", connectionString);
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });
    try {
        await prisma.$connect();
        console.log("Connection successful!");
        const tenants = await prisma.tenant.findMany();
        console.log("Tenants found:", tenants.length);
    } catch (e: any) {
        console.error("Prisma connection failed:", e);
        console.error("Error Code:", e.code);
        console.error("Meta:", e.meta);
    } finally {
        await prisma.$disconnect();
    }
}

main();
