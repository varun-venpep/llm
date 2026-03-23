require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
});

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
