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

        const session = await checkSession(req, domain);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Fetch all teams where this user is one of the managers (many-to-many)
        const teams = await prisma.team.findMany({
            where: {
                tenantId: tenant.id,
                managers: {
                    some: { id: session.id }
                }
            },
            include: {
                managers: { select: { id: true, name: true, email: true } },
                members: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        jobRoles: { select: { name: true } }
                    }
                }
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(teams);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch manager teams' }, { status: 500 });
    }
}
