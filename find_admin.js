const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  try {
    const tenants = await prisma.tenant.findMany({ take: 5 });
    console.log('Tenants found:', tenants.map(t => t.subdomain).join(', '));
    for (const tenant of tenants) {
      const admin = await prisma.user.findFirst({
        where: { tenantId: tenant.id, role: 'TENANT_ADMIN' }
      });
      if (admin) {
        console.log('Admin found for', tenant.subdomain, ':', admin.email);
        return;
      }
    }
    console.log('No admin found in first 5 tenants');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.();
    process.exit(0);
  }
}
run();
