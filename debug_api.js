require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const domain = 'venpep';
  console.log(`Checking domain: ${domain}`);
  
  const tenant = await prisma.tenant.findUnique({
    where: { subdomain: domain }
  });
  
  if (!tenant) {
    console.log('Tenant not found');
    return;
  }
  
  console.log('Tenant found:', tenant.id);
  
  try {
    const templates = await prisma.certificateTemplate.findMany({
      where: {
        OR: [
          { isGlobal: true },
          { tenantId: tenant.id }
        ],
        isActive: true
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log('Templates found:', templates.length);
  } catch (error) {
    console.error('Query Error:', error);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    pool.end();
  });
