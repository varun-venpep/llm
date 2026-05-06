import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { checkSession, requireTenantPermission } from '@/lib/auth';
import { Prisma, Role } from '@prisma/client';
import { normalizeTenantAdminPermissions } from '@/lib/permissions';

const editableRoles = new Set<Role>([
    Role.LEARNER,
    Role.TENANT_ADMIN,
    Role.INSTRUCTOR,
    Role.TEACHER,
    Role.PLATFORM_MANAGER
]);

const getEditableRole = (value: unknown) => {
    if (typeof value !== 'string') return Role.LEARNER;
    const role = value.toUpperCase() as Role;
    return editableRoles.has(role) ? role : Role.LEARNER;
};

const ensureTenantAdminPermissionsColumn = () => prisma.$executeRaw`
    ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS "tenantAdminPermissions" TEXT[] DEFAULT ARRAY[]::TEXT[]
`;

const hasAnyTenantPermission = (
    session: Awaited<ReturnType<typeof checkSession>>,
    permissions: string[]
) => permissions.some(permission => requireTenantPermission(session, permission));

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    try {
        const { domain } = await params;
        const body = await req.json();
        const { email, name, password, jobRoleIds, teamIds, managedTeamIds } = body;
        const role = getEditableRole(body.role);
        const tenantAdminPermissions = normalizeTenantAdminPermissions(body.tenantAdminPermissions);

        await ensureTenantAdminPermissionsColumn();

        const tenant = await prisma.tenant.findUnique({
            where: { subdomain: domain },
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        const session = await checkSession(req, domain, ['TENANT_ADMIN', 'SUPER_ADMIN']);
        const requiredPermission = role === Role.LEARNER ? 'learners.manage' : 'people.manage';
        if (!requireTenantPermission(session, requiredPermission)) {
            return NextResponse.json({
                error: role === Role.LEARNER
                    ? 'You do not have permission to create learners'
                    : 'You do not have permission to manage admins'
            }, { status: 403 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const learner = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role,
                tenantId: tenant.id,
                jobRoles: {
                    connect: (jobRoleIds || []).map((id: string) => ({ id }))
                },
                teams: {
                    connect: (teamIds || []).map((id: string) => ({ id }))
                },
                managedTeams: {
                    connect: (managedTeamIds || []).map((id: string) => ({ id }))
                }
            },
        });

        await prisma.$executeRaw`
            UPDATE "User"
            SET "tenantAdminPermissions" = ARRAY[${Prisma.join(tenantAdminPermissions)}]::TEXT[]
            WHERE "id" = ${learner.id}
        `;

        // 2. Auto-enroll in team-assigned courses (Internal Library / Marketplace)
        if (teamIds && teamIds.length > 0) {
            const assignedCourses = await prisma.teamCourseAssignment.findMany({
                where: { teamId: { in: teamIds } },
                select: { courseId: true }
            });
            const uniqueCourseIds = Array.from(new Set(assignedCourses.map(ac => ac.courseId)));
            if (uniqueCourseIds.length > 0) {
                await prisma.enrollment.createMany({
                    data: uniqueCourseIds.map(cid => ({
                        userId: learner.id,
                        courseId: cid,
                        status: 'ACTIVE'
                    })),
                    skipDuplicates: true
                });
            }
        }

        // Audit Log: Learner Creation
        if (session) {
            await prisma.activityLog.create({
                data: {
                    userId: session.id,
                    action: 'LEARNER_CREATED',
                    metadata: { learnerId: learner.id, email: learner.email, name: learner.name }
                }
            });
        }

        return NextResponse.json({
            success: true,
            learnerId: learner.id,
            message: 'User created successfully'
        });

    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Learner email already exists in this workspace' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    try {
        const { domain } = await params;
        await ensureTenantAdminPermissionsColumn();
        const session = await checkSession(req, domain, ['TENANT_ADMIN', 'SUPER_ADMIN']);
        if (!hasAnyTenantPermission(session, ['learners.manage', 'people.manage'])) {
            return NextResponse.json({ error: 'You do not have permission to view users' }, { status: 403 });
        }

        const learners = await prisma.user.findMany({
            where: {
                tenant: { subdomain: domain },
                role: { not: 'SUPER_ADMIN' },
            },
            include: {
                jobRoles: { select: { id: true, name: true } },
                teams: { select: { id: true, name: true } },
                enrollments: {
                    include: {
                        course: {
                            select: {
                                id: true,
                                title: true,
                                modules: {
                                    where: { isActive: true },
                                    include: {
                                        lessons: {
                                            where: { isActive: true },
                                            select: { id: true }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                progress: true,
                quizAttempts: {
                    include: {
                        quiz: {
                            select: {
                                title: true,
                                passingScore: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                activityLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 50
                }
            },
            orderBy: { createdAt: 'desc' },
        });
        const formattedLearners = await Promise.all(learners.map(async learner => {
            const permissionRows = await prisma.$queryRaw<{ tenantAdminPermissions: string[] | null }[]>`
                SELECT "tenantAdminPermissions"
                FROM "User"
                WHERE "id" = ${learner.id}
                LIMIT 1
            `;

            return {
                ...learner,
                tenantAdminPermissions: permissionRows[0]?.tenantAdminPermissions || []
            };
        }));

        return NextResponse.json(formattedLearners);
    } catch (error) {
        console.error('Learners GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch learners' }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    try {
        const { domain } = await params;
        const body = await req.json();
        const { learnerId, newPassword, isActive, name, email, jobRoleIds, teamIds, managedTeamIds } = body;
        const shouldUpdateRole = body.role !== undefined;
        const role = shouldUpdateRole ? getEditableRole(body.role) : undefined;
        const shouldUpdateTenantAdminPermissions = body.tenantAdminPermissions !== undefined;
        const tenantAdminPermissions = normalizeTenantAdminPermissions(body.tenantAdminPermissions);

        await ensureTenantAdminPermissionsColumn();

        const tenant = await prisma.tenant.findUnique({
            where: { subdomain: domain }
        });

        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        const targetUser = !role && learnerId
            ? await prisma.user.findFirst({
                where: { id: learnerId, tenantId: tenant.id },
                select: { role: true }
            })
            : null;

        const session = await checkSession(req, domain, ['TENANT_ADMIN', 'SUPER_ADMIN']);
        const targetRole = role || targetUser?.role;
        const requiredPermission = targetRole === Role.LEARNER ? 'learners.manage' : 'people.manage';
        if (!requireTenantPermission(session, requiredPermission)) {
            return NextResponse.json({
                error: requiredPermission === 'learners.manage'
                    ? 'You do not have permission to update learners'
                    : 'You do not have permission to manage admins'
            }, { status: 403 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: learnerId, tenantId: tenant.id },
            data: {
                ...(name && { name }),
                ...(email && { email }),
                ...(role && { role }),
                ...(newPassword && { password: await bcrypt.hash(newPassword, 10) }),
                ...(typeof isActive === 'boolean' && { isActive }),
                ...(jobRoleIds !== undefined && {
                    jobRoles: { set: jobRoleIds.map((id: string) => ({ id })) }
                }),
                ...(managedTeamIds !== undefined && {
                    managedTeams: { set: managedTeamIds.map((id: string) => ({ id })) }
                }),
                ...(teamIds !== undefined && {
                    teams: { set: teamIds.map((id: string) => ({ id })) }
                })
            },
            select: { id: true, role: true }
        });

        if (shouldUpdateRole || shouldUpdateTenantAdminPermissions) {
            await prisma.$executeRaw`
                UPDATE "User"
                SET "tenantAdminPermissions" = ARRAY[${Prisma.join(tenantAdminPermissions)}]::TEXT[]
                WHERE "id" = ${updatedUser.id}
            `;
        }

        // Audit Log: Learner Update
        if (session) {
            await prisma.activityLog.create({
                data: {
                    userId: session.id,
                    action: 'LEARNER_UPDATED',
                    metadata: { learnerId, email, name, isActive }
                }
            });
        }

        // Backward compatibility if single teamId is passed
        // Note: Replaced manual looping disconnects with Prisma's `set` relation above which is much cleaner!
        if (body.teamId !== undefined && teamIds === undefined) {
            // First remove from all teams in this tenant
            const allTenantTeams = await prisma.team.findMany({ where: { tenantId: tenant.id }, select: { id: true } });
            if (allTenantTeams.length > 0) {
                await prisma.team.updateMany({
                    where: { tenantId: tenant.id },
                    data: {} // Can't disconnect via updateMany; using loop
                });
                for (const team of allTenantTeams) {
                    await prisma.team.update({
                        where: { id: team.id },
                        data: { members: { disconnect: { id: learnerId } } }
                    });
                }
            }
            // Now connect to new team (if any)
            if (body.teamId) {
                await prisma.team.update({
                    where: { id: body.teamId },
                    data: { members: { connect: { id: learnerId } } }
                });
            }
        }

        return NextResponse.json({ success: true, message: 'User updated successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update learner' }, { status: 500 });
    }
}


export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    try {
        const { domain } = await params;
        const learnerId = req.nextUrl.searchParams.get('learnerId');

        if (!learnerId) {
            return NextResponse.json({ error: 'Learner ID required' }, { status: 400 });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { subdomain: domain }
        });

        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        const session = await checkSession(req, domain, ['TENANT_ADMIN', 'SUPER_ADMIN']);
        if (!requireTenantPermission(session, 'learners.manage')) {
            return NextResponse.json({ error: 'You do not have permission to delete learners' }, { status: 403 });
        }

        // Delete user (Prisma should handle cascade if configured, but we check here)
        await prisma.user.delete({
            where: { id: learnerId, tenantId: tenant.id }
        });

        // Audit Log: Learner Deletion
        if (session) {
            await prisma.activityLog.create({
                data: {
                    userId: session.id,
                    action: 'LEARNER_DELETED',
                    metadata: { learnerId }
                }
            });
        }

        return NextResponse.json({ success: true, message: 'Learner deleted successfully' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to delete learner' }, { status: 500 });
    }
}
