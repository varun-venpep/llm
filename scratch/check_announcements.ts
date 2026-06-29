import { prisma } from '../src/lib/prisma';

async function main() {
    try {
        const announcements = await prisma.announcement.findMany({
            include: { tenant: true }
        });
        console.log("Announcements Count:", announcements.length);
        console.log("Announcements Details:", JSON.stringify(announcements, null, 2));
    } catch (e) {
        console.error("Prisma error:", e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
