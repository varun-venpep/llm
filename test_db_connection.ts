import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    const tenants = await prisma.tenant.findMany()
    console.log('Successfully connected to DB. Found tenants:', tenants.length)
  } catch (e) {
    console.error('FAILED TO CONNECT TO DB:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
