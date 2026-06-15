import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Seeding Super Admin...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    // First ensure a system tenant exists
    const systemTenant = await prisma.tenant.upsert({
        where: { subdomain: 'admin-system' },
        update: {},
        create: {
            name: 'System Platform',
            subdomain: 'admin-system',
            isActive: true,
        }
    });

    // Create the super admin user linked to the system tenant
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

    // Seed Venpep Tenant (Tenant Admin & Learner)
    console.log('Seeding Venpep Tenant...');
    const venpepTenant = await prisma.tenant.upsert({
        where: { subdomain: 'venpep' },
        update: {},
        create: {
            name: 'Venpep Academy',
            subdomain: 'venpep',
            isActive: true,
        }
    });

    const tenantAdmin = await prisma.user.upsert({
        where: {
            email_tenantId: {
                email: 'admin@venpep.com',
                tenantId: venpepTenant.id
            }
        },
        update: { password: hashedPassword },
        create: {
            email: 'admin@venpep.com',
            name: 'Venpep Admin',
            password: hashedPassword,
            role: 'TENANT_ADMIN',
            tenantId: venpepTenant.id
        }
    });

    const learner = await prisma.user.upsert({
        where: {
            email_tenantId: {
                email: 'learner@venpep.com',
                tenantId: venpepTenant.id
            }
        },
        update: { password: hashedPassword },
        create: {
            email: 'learner@venpep.com',
            name: 'Venpep Learner',
            password: hashedPassword,
            role: 'LEARNER',
            tenantId: venpepTenant.id
        }
    });

    console.log('Venpep Tenant Seeded:', venpepTenant.subdomain);
    console.log('Admin:', tenantAdmin.email, '/ password123');
    console.log('Learner:', learner.email, '/ password123');
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
