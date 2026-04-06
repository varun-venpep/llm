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
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const teams = await prisma.team.findMany({
            where: { tenantId: tenant.id },
            include: {
                managers: { select: { id: true, name: true, email: true } },
                members: { select: { id: true } },
                _count: { select: { members: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(teams);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
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
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { name, description, managerIds = [], memberIds = [], isActive = true } = await req.json();
        
        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

        const team = await prisma.team.create({
            data: {
                name,
                description,
                isActive,
                tenantId: tenant.id,
                managers: {
                    connect: managerIds.map((id: string) => ({ id }))
                },
                members: {
                    connect: memberIds.map((id: string) => ({ id }))
                }
            },
            include: {
                managers: { select: { id: true, name: true, email: true } },
                _count: { select: { members: true } }
            }
        });

        // Audit Log: Team Creation
        if (session) {
            await prisma.activityLog.create({
                data: {
                    userId: session.id,
                    action: 'TEAM_CREATED',
                    metadata: { teamId: team.id, name: team.name }
                }
            });
        }

        return NextResponse.json(team);
    } catch (error) {
        console.error('Create team error:', error);
        return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
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

        const { id, name, description, isActive, managerIds = [], memberIds = [] } = await req.json();
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        // Get current team data
        const currentTeam = await prisma.team.findUnique({
            where: { id, tenantId: tenant.id },
            include: {
                managers: { select: { id: true } },
                members: { select: { id: true } }
            }
        });
        if (!currentTeam) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

        // Diff members
        const currentMemberIds = currentTeam.members.map(m => m.id);
        const toConnectMembers = memberIds.filter((mid: string) => !currentMemberIds.includes(mid));
        const toDisconnectMembers = currentMemberIds.filter(mid => !memberIds.includes(mid));

        // Diff managers
        const currentManagerIds = currentTeam.managers.map(m => m.id);
        const toConnectManagers = managerIds.filter((mid: string) => !currentManagerIds.includes(mid));
        const toDisconnectManagers = currentManagerIds.filter(mid => !managerIds.includes(mid));

        const team = await prisma.team.update({
            where: { id, tenantId: tenant.id },
            data: {
                ...(name && { name }),
                description: description ?? undefined,
                ...(isActive !== undefined && { isActive }),
                managers: {
                    connect: toConnectManagers.map((mid: string) => ({ id: mid })),
                    disconnect: toDisconnectManagers.map((mid: string) => ({ id: mid }))
                },
                members: {
                    connect: toConnectMembers.map((mid: string) => ({ id: mid })),
                    disconnect: toDisconnectMembers.map((mid: string) => ({ id: mid }))
                }
            },
            include: {
                managers: { select: { id: true, name: true, email: true } },
                _count: { select: { members: true } }
            }
        });

        // Audit Log: Team Update
        if (session) {
            await prisma.activityLog.create({
                data: {
                    userId: session.id,
                    action: 'TEAM_UPDATED',
                    metadata: { teamId: team.id, name: team.name, isActive: team.isActive }
                }
            });
        }

        return NextResponse.json(team);
    } catch (error) {
        console.error('Update team error:', error);
        return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });
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
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const id = req.nextUrl.searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        await prisma.team.delete({
            where: { id, tenantId: tenant.id }
        });

        // Audit Log: Team Deletion
        if (session) {
            await prisma.activityLog.create({
                data: {
                    userId: session.id,
                    action: 'TEAM_DELETED',
                    metadata: { teamId: id }
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 });
    }
}
