require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client'); // Added this line
const bcrypt = require('bcrypt'); // Added this line

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Seeding Super Admin...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const systemTenant = await prisma.tenant.upsert({
        where: { subdomain: 'admin-system' },
        update: {},
        create: {
            name: 'System Platform',
            subdomain: 'admin-system',
            isActive: true,
        }
    });

    const superAdmin = await prisma.user.upsert({
        where: { 
            email_tenantId: {
                email: 'superadmin@lvh.com',
                tenantId: systemTenant.id
            }
        },
        update: {
            password: hashedPassword,
        },
        create: {
            email: 'superadmin@lvh.com',
            name: 'Master Admin',
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            tenantId: systemTenant.id
        },
    });

    console.log('Super Admin Seeded:', superAdmin.email);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
