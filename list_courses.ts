import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = "postgresql://sowndarkumar@localhost:5432/postgres";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const courses = await prisma.course.findMany({
        select: { id: true, title: true }
    });
    console.log("All Courses:");
    console.log(JSON.stringify(courses, null, 2));
    await prisma.$disconnect();
    await pool.end();
}
main();
