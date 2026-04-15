import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = "postgresql://sowndarkumar@localhost:5432/postgres";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const courseId = 'cmmt2k8gy000e6gynu3zxdrpr';
    await prisma.course.update({
        where: { id: courseId },
        data: { description: "Learn the core rules and principles of Vibe Coding in this introductory module. We cover Rule 1 and Rule 2 to get you started with Antigravity." }
    });
    console.log("Course description updated.");
    await prisma.$disconnect();
    await pool.end();
}
main();
