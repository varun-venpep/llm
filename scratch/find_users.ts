import { prisma } from '../src/lib/prisma';

async function main() {
    const users = await prisma.user.findMany({
        include: {
            tenant: true
        }
    });
    console.log("USERS_LIST_START");
    for (const u of users) {
        console.log(`Email: ${u.email} | Role: ${u.role} | Subdomain: ${u.tenant.subdomain} | Password (starts with): ${u.password.substring(0, 10)}`);
    }
    console.log("USERS_LIST_END");
}

main().catch(console.error).finally(() => prisma.$disconnect());
