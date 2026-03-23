import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = "postgresql://sowndarkumar@localhost:5432/postgres";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const courseId = 'cmmkc4m1c00003qynr0l65yc4';
    const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
            modules: {
                include: {
                    lessons: {
                        select: {
                            id: true,
                            title: true,
                            type: true,
                            videoUrl: true
                        }
                    }
                }
            }
        }
    });

    console.log("Course Video URLs:");
    console.log(JSON.stringify(course?.modules, null, 2));

    await prisma.$disconnect();
    await pool.end();
}
main();
