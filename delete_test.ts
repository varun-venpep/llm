import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    try {
        const course = await prisma.course.findFirst({ where: { title: { contains: "AI Coder" } } });
        if (course) {
            console.log("Found course:", course.id);
            await prisma.course.delete({ where: { id: course.id } });
            console.log("Deleted successfully");
        } else {
            console.log("Course not found");
        }
    } catch (e: any) {
        console.error("Prisma Error:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}
main();
