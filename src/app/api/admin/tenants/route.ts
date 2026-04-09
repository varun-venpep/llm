import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, adminEmail, adminPassword } = body;

        // Basic validation
        if (!name || !adminEmail || !adminPassword) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Generate dynamic subdomain
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const randomString = Math.random().toString(36).substring(2, 8);
        const subdomain = `${slug}-${randomString}`;

        // Check if tenant or subdomain exists (extremely unlikely due to random char, but kept for safety)
        const existingTenant = await prisma.tenant.findUnique({
            where: { subdomain },
        });

        if (existingTenant) {
            return NextResponse.json({ error: 'Subdomain already taken' }, { status: 400 });
        }

        // Create Tenant and Admin User in a transaction
        const result = await prisma.$transaction(async (tx: any) => {
            const tenant = await tx.tenant.create({
                data: {
                    name,
                    subdomain,
                    primaryColor: '#3b82f6', // Default blue
                },
            });

            const hashedPassword = await bcrypt.hash(adminPassword, 10);

            const user = await tx.user.create({
                data: {
                    email: adminEmail,
                    password: hashedPassword,
                    name: 'Tenant Admin',
                    role: 'TENANT_ADMIN',
                    tenantId: tenant.id,
                },
            });

            return { tenant, user };
        });

        const rootDomain = process.env.ROOT_DOMAIN || process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'lvh.me:3000';
        
        return NextResponse.json({
            success: true,
            tenantId: result.tenant.id,
            subdomain: result.tenant.subdomain,
            fullDomain: `${result.tenant.subdomain}.${rootDomain}`,
            message: 'Workspace created successfully'
        });

    } catch (error) {
        console.error('Tenant creation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const tenants = await prisma.tenant.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                users: {
                    where: { role: 'TENANT_ADMIN' },
                    take: 1,
                    select: { email: true }
                },
                _count: {
                    select: { users: true, courses: true }
                }
            }
        });

        // Add adminEmail to the response for consumption in the UI
        const formattedTenants = tenants.map((tenant: any) => ({
            ...tenant,
            adminEmail: tenant.users[0]?.email || null
        }));

        return NextResponse.json(formattedTenants);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 });
    }
}
