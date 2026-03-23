import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
async function main() {
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    await prisma.user.updateMany({
        where: { email: { in: ['admin@acme.com', 'student@acme.com'] } },
        data: { password: hashedPassword }
    });
    
    console.log("Passwords updated!");
}
main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
