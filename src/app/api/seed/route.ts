import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
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

        return NextResponse.json({ success: true, superAdmin: superAdmin.email });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
