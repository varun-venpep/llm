import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = "postgresql://sowndarkumar@localhost:5432/postgres";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const courseId = 'cmmkc4m1c00003qynr0l65yc4'; // ID from the user screenshot URL
    await prisma.course.update({
        where: { id: courseId },
        data: { 
            title: "Antigravity", 
            description: "An introductory course to the world of Antigravity technology and its applications in modern engineering." 
        }
    });
    console.log("Course title and description updated for ID:", courseId);
    await prisma.$disconnect();
    await pool.end();
}
main();
