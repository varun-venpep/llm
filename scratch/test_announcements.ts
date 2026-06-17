import { prisma } from '../src/lib/prisma';

async function test() {
    try {
        const tenant = await prisma.tenant.findFirst({
            where: { subdomain: 'test' }
        });
        if (!tenant) throw new Error("No tenant found with subdomain 'test'");
        console.log("Tenant subdomain:", tenant.subdomain);
        
        const reads = await prisma.announcementRead.findMany({
            where: { userId: "some-user-id" },
            select: { announcementId: true }
        });
        console.log("Reads found:", reads);
        
        const announcements = await prisma.announcement.findMany({
            where: { tenantId: tenant.id },
            orderBy: { createdAt: 'desc' }
        });
        console.log("Announcements found:", announcements.length);
        
    } catch (err) {
        console.error("TEST ERROR:", err);
    } finally {
        await prisma.$disconnect();
    }
}

test();
