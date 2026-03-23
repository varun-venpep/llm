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
        select: { description: true }
    });

    console.log("Course Description:");
    console.log(course?.description);

    await prisma.$disconnect();
    await pool.end();
}
main();
