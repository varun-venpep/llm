const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const templates = await prisma.certificateTemplate.findMany({});
  console.log(JSON.stringify(templates, null, 2));
}

main()
  .catch(err => {
    console.error(err);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
