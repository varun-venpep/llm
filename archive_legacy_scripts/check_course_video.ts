import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = "postgresql://sowndarkumar@localhost:5432/postgres";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Starting comprehensive DB check...");
    try {
        const courses = await prisma.course.findMany({
            include: {
                modules: {
                    include: {
                        lessons: {
                            include: {
                                resources: true
                            }
                        }
                    }
                }
            }
        });

        console.log(`Found ${courses.length} courses`);
        courses.forEach(course => {
            console.log(`\nCourse: ${course.title} (ID: ${course.id})`);
            course.modules.forEach(m => {
                console.log(`  Module: ${m.title}`);
                m.lessons.forEach(l => {
                    console.log(`    Lesson: ${l.title}`);
                    console.log(`      Type: ${l.type}`);
                    console.log(`      Video URL: ${l.videoUrl}`);
                    console.log(`      PDF URL: ${l.pdfUrl}`);
                    console.log(`      Resources: ${l.resources.length}`);
                    l.resources.forEach(r => {
                        console.log(`        - Resource: ${r.name}, Type: ${r.type}, URL: ${r.url}`);
                    });
                });
            });
        });
    } catch (e) {
        console.error("Error:", e);
    }

    await prisma.$disconnect();
    await pool.end();
}
main();
