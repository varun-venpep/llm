import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, subdomain, adminEmail, adminPassword } = body;

        // Basic validation
        if (!name || !subdomain || !adminEmail || !adminPassword) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if tenant or subdomain exists
        const existingTenant = await prisma.tenant.findUnique({
            where: { subdomain },
        });

        if (existingTenant) {
            return NextResponse.json({ error: 'Subdomain already taken' }, { status: 400 });
        }

        // Create Tenant and Admin User in a transaction
        const result = await prisma.$transaction(async (tx) => {
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

        return NextResponse.json({
            success: true,
            tenantId: result.tenant.id,
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
                _count: {
                    select: { users: true, courses: true }
                }
            }
        });
        return NextResponse.json(tenants);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 });
    }
}
