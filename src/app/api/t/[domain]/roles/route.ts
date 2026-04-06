import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkSession } from '@/lib/auth';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    try {
        const { domain } = await params;
        const tenant = await prisma.tenant.findUnique({ where: { subdomain: domain } });
        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        const session = await checkSession(req, domain, 'TENANT_ADMIN');
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const roles = await prisma.jobRole.findMany({
            where: { tenantId: tenant.id },
            include: { 
                _count: { select: { users: true } },
                users: { select: { id: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(roles);
    } catch (error) {
        console.error('[ROLES_GET_ERROR]', error);
        return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    try {
        const { domain } = await params;
        const tenant = await prisma.tenant.findUnique({ where: { subdomain: domain } });
        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        const session = await checkSession(req, domain, 'TENANT_ADMIN');
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, description, isActive = true } = await req.json();
        
        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

        const role = await prisma.jobRole.create({
            data: {
                name,
                description,
                isActive,
                tenantId: tenant.id
            }
        });

        // Audit Log: Role Creation
        if (session) {
            await prisma.activityLog.create({
                data: {
                    userId: session.id,
                    action: 'ROLE_CREATED',
                    metadata: { roleId: role.id, name: role.name }
                }
            });
        }

        return NextResponse.json(role);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    try {
        const { domain } = await params;
        const tenant = await prisma.tenant.findUnique({ where: { subdomain: domain } });
        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        const session = await checkSession(req, domain, 'TENANT_ADMIN');
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id, name, description, isActive, userIds } = await req.json();
        if (!id) return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });

        // Update the role itself
        await prisma.jobRole.update({
            where: { id, tenantId: tenant.id },
            data: { 
                ...(name && { name }), 
                description: description ?? undefined,
                ...(isActive !== undefined && { isActive })
            }
        });

        // Sync user membership: utilizing Prisma's set function to drop missing and add new directly!
        if (Array.isArray(userIds)) {
            await prisma.jobRole.update({
                where: { id },
                data: {
                    users: { set: userIds.map((id: string) => ({ id })) }
                }
            });
        }



        // Audit Log: Role Update
        if (session) {
            await prisma.activityLog.create({
                data: {
                    userId: session.id,
                    action: 'ROLE_UPDATED',
                    metadata: { roleId: id, name, isActive, userCount: userIds?.length }
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
    }
}


export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    try {
        const { domain } = await params;
        const tenant = await prisma.tenant.findUnique({ where: { subdomain: domain } });
        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        const session = await checkSession(req, domain, 'TENANT_ADMIN');
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const id = req.nextUrl.searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        await prisma.jobRole.delete({
            where: { id, tenantId: tenant.id }
        });

        // Audit Log: Role Deletion
        if (session) {
            await prisma.activityLog.create({
                data: {
                    userId: session.id,
                    action: 'ROLE_DELETED',
                    metadata: { roleId: id }
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
    }
}
