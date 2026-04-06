import { prisma } from './src/lib/prisma';

async function diagnose() {
  try {
    console.log("Checking Tenant table...");
    const tenants = await prisma.tenant.findMany({
      take: 1
    });
    console.log("Sample tenant:", JSON.stringify(tenants[0], null, 2));

    const venpep = await prisma.tenant.findUnique({
      where: { subdomain: 'venpep' }
    });
    console.log("Venpep tenant exists:", !!venpep);
    if (venpep) {
      console.log("Venpep fields:", Object.keys(venpep));
    }
  } catch (error) {
    console.error("Diagnosis failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnose();
