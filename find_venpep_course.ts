import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const tenant = await prisma.tenant.findUnique({ where: { subdomain: 'venpep' } });
    if (!tenant) {
        console.log("Tenant 'venpep' not found");
        return;
    }
    const courses = await prisma.course.findMany({
        where: { tenantId: tenant.id },
        orderBy: { createdAt: 'desc' },
        take: 1
    });
    if (courses.length > 0) {
        console.log("COURSE_ID:" + courses[0].id);
    } else {
        console.log("No courses found for venpep");
    }
    await prisma.$disconnect();
}
main();
