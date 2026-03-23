import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = "postgresql://sowndarkumar@localhost:5432/postgres";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const courseId = 'cmmt2k8gy000e6gynu3zxdrpr';
    const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { title: true, description: true }
    });

    console.log("Course Data:");
    console.log(JSON.stringify(course, null, 2));

    await prisma.$disconnect();
    await pool.end();
}
main();
