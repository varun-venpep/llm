import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { checkSession } from '@/lib/auth';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    try {
        const { domain } = await params;
        const body = await req.json();
        const { email, name, password, jobRoleIds, teamIds, managedTeamIds } = body;

        const tenant = await prisma.tenant.findUnique({
            where: { subdomain: domain },
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const learner = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role: 'LEARNER',
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

        // 2. Auto-enroll in team-assigned courses (Internal Library / Marketplace)
        if (teamIds && teamIds.length > 0) {
            const assignedCourses = await prisma.teamCourseAssignment.findMany({
                where: { teamId: { in: teamIds } },
                select: { courseId: true }
            });
            const uniqueCourseIds = Array.from(new Set(assignedCourses.map((ac: any) => ac.courseId)));
            if (uniqueCourseIds.length > 0) {
                await prisma.enrollment.createMany({
                    data: uniqueCourseIds.map((cid: any) => ({
                        userId: learner.id,
                        courseId: cid,
                        status: 'ACTIVE'
                    })),
                    skipDuplicates: true
                });
            }
        }

        // Audit Log: Learner Creation
        const session = await checkSession(req, domain);
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
            message: 'Learner created successfully'
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
        const learners = await prisma.user.findMany({
            where: {
                tenant: { subdomain: domain },
                role: 'LEARNER',
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
        return NextResponse.json(learners);
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
 
        const tenant = await prisma.tenant.findUnique({
            where: { subdomain: domain }
        });
 
        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
 
        await prisma.user.update({
            where: { id: learnerId, tenantId: tenant.id },
            data: {
                ...(name && { name }),
                ...(email && { email }),
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
            }
        });

        // Audit Log: Learner Update
        const session = await checkSession(req, domain);
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
 
        return NextResponse.json({ success: true, message: 'Learner updated successfully' });
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

        // Delete user (Prisma should handle cascade if configured, but we check here)
        await prisma.user.delete({
            where: { id: learnerId, tenantId: tenant.id }
        });

        // Audit Log: Learner Deletion
        const session = await checkSession(req, domain);
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
