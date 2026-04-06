const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const users = await prisma.user.findMany({
    where: { role: 'TENANT_ADMIN' },
    include: { tenant: true }
  });
  console.log(JSON.stringify(users, null, 2));
  process.exit(0);
}
run();
