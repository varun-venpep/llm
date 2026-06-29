import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, props: { params: Promise<{ domain: string }> }) {
    const params = await props.params;
    const { domain } = params;
    const sessionId = req.cookies.get('admin_token')?.value || req.cookies.get('session-token')?.value;
    if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const currentUser = await prisma.user.findUnique({
        where: { id: sessionId },
        select: { role: true }
    });

    if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'PLATFORM_MANAGER' && currentUser.role !== 'TENANT_ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const tenants = await prisma.tenant.findMany({
            select: { id: true, name: true, subdomain: true },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json({ tenants });
    } catch (error) {
        console.error('Failed to fetch transfer tenants:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest, props: { params: Promise<{ domain: string }> }) {
    const params = await props.params;
    const { domain } = params;
    const sessionId = req.cookies.get('admin_token')?.value || req.cookies.get('session-token')?.value;
    if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const currentUser = await prisma.user.findUnique({
        where: { id: sessionId },
        select: { role: true }
    });

    if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'PLATFORM_MANAGER' && currentUser.role !== 'TENANT_ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { action, userId, targetTenantId, otp } = body;

        if (!userId || !targetTenantId) {
            return NextResponse.json({ error: 'Missing userId or targetTenantId' }, { status: 400 });
        }

        const employee = await prisma.user.findUnique({
            where: { id: userId },
            include: { tenant: true }
        });

        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        const targetTenant = await prisma.tenant.findUnique({
            where: { id: targetTenantId }
        });

        if (!targetTenant) {
            return NextResponse.json({ error: 'Target tenant not found' }, { status: 404 });
        }

        if (action === 'send') {
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

            await prisma.user.update({
                where: { id: userId },
                data: {
                    resetCode: code,
                    resetExpires: expires
                }
            });

            console.log(`\n========================================\nTRANSFER OTP FOR ${employee.name || employee.email}: ${code}\n========================================\n`);

            return NextResponse.json({
                success: true,
                message: `OTP generated. Code: ${code}`,
                otp: code
            });
        }

        if (action === 'verify') {
            if (!otp) {
                return NextResponse.json({ error: 'Missing OTP code' }, { status: 400 });
            }

            if (employee.resetCode !== otp) {
                return NextResponse.json({ error: 'Invalid OTP code' }, { status: 400 });
            }

            if (!employee.resetExpires || new Date() > employee.resetExpires) {
                return NextResponse.json({ error: 'OTP code has expired' }, { status: 400 });
            }

            // check unique constraint @@unique([email, tenantId])
            const emailCollision = await prisma.user.findFirst({
                where: {
                    email: employee.email,
                    tenantId: targetTenantId
                }
            });

            if (emailCollision) {
                return NextResponse.json({ error: `User with email ${employee.email} already exists in ${targetTenant.name}` }, { status: 400 });
            }

            // Transfer user and disconnect from tenant-specific relations (teams, job roles)
            await prisma.user.update({
                where: { id: userId },
                data: {
                    tenantId: targetTenantId,
                    resetCode: null,
                    resetExpires: null,
                    teams: { set: [] },
                    jobRoles: { set: [] },
                    managedTeams: { set: [] }
                }
            });

            // Log activity log
            await prisma.activityLog.create({
                data: {
                    userId: employee.id,
                    action: 'TRANSFERRED',
                    metadata: {
                        fromTenantId: employee.tenantId,
                        fromTenantName: employee.tenant.name,
                        toTenantId: targetTenantId,
                        toTenantName: targetTenant.name
                    }
                }
            });

            return NextResponse.json({
                success: true,
                message: `Employee transferred successfully to ${targetTenant.name}`
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Transfer API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
