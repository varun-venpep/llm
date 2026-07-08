import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { checkSession } from '@/lib/auth';
import { Role } from '@prisma/client';
import { getTenantLearnerLimit } from '@/lib/planLimits';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    try {
        const { domain } = await params;
        const body = await req.json();
        const { users } = body;

        if (!Array.isArray(users)) {
            return NextResponse.json({ error: 'Invalid payload: users must be an array' }, { status: 400 });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { subdomain: domain },
            include: { teams: true }
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        // Check learner limit for the tenant first
        const { userLimit, planName } = await getTenantLearnerLimit(tenant.id);

        if (userLimit > 0) {
            const learnerEmails = users
                .filter((userData: any) => {
                    const rawRole = userData.role || '';
                    const normalizedRole = rawRole.toLowerCase();
                    let resolvedRole: Role = Role.LEARNER;
                    if (normalizedRole.includes('admin')) {
                        resolvedRole = Role.TENANT_ADMIN;
                    } else if (normalizedRole.includes('manager')) {
                        resolvedRole = Role.PLATFORM_MANAGER;
                    } else if (normalizedRole.includes('instructor') || normalizedRole.includes('teacher')) {
                        resolvedRole = Role.INSTRUCTOR;
                    }
                    return resolvedRole === Role.LEARNER && userData.email;
                })
                .map((userData: any) => userData.email.toLowerCase());

            const uniqueLearnerEmails = Array.from(new Set(learnerEmails));

            const existingLearnersCount = await prisma.user.count({
                where: {
                    tenantId: tenant.id,
                    role: 'LEARNER'
                }
            });

            // Find how many of these unique emails already exist as learners in the database
            const existingLearnersInDb = await prisma.user.findMany({
                where: {
                    tenantId: tenant.id,
                    role: 'LEARNER',
                    email: { in: uniqueLearnerEmails }
                },
                select: { email: true }
            });

            const existingEmailsSet = new Set(existingLearnersInDb.map(u => u.email.toLowerCase()));
            const newLearnersCount = uniqueLearnerEmails.filter(email => !existingEmailsSet.has(email)).length;

            if (existingLearnersCount + newLearnersCount > userLimit) {
                return NextResponse.json({
                    error: `Bulk import would exceed the learner limit for your plan (${planName}). You currently have ${existingLearnersCount} learners, and you tried to add ${newLearnersCount} new learners, exceeding the limit of ${userLimit}. Please update your package to import more learners.`
                }, { status: 400 });
            }
        }

        const results = [];
        const existingTeams = tenant.teams;

        for (const userData of users) {
            try {
                const { name, email, role: rawRole, teams: rawTeams } = userData;

                if (!email || !name) {
                    results.push({ email: email || 'unknown', status: 'error', error: 'Missing name or email' });
                    continue;
                }

                // 1. Resolve Role
                let role: Role = Role.LEARNER;
                const normalizedRole = rawRole?.toLowerCase() || '';
                if (normalizedRole.includes('admin')) {
                    role = Role.TENANT_ADMIN;
                } else if (normalizedRole.includes('manager')) {
                    role = Role.PLATFORM_MANAGER;
                } else if (normalizedRole.includes('instructor') || normalizedRole.includes('teacher')) {
                    role = Role.INSTRUCTOR;
                }

                // 2. Resolve Teams (Fuzzy match / create)
                const teamNames = rawTeams ? rawTeams.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
                const matchedTeamIds: string[] = [];
                const managedTeamIds: string[] = [];

                for (const tName of teamNames) {
                    // Check for existing case-insensitive match
                    let team = existingTeams.find(et => et.name.toLowerCase() === tName.toLowerCase());

                    if (!team) {
                        // Create new team if no resemblance found
                        team = await prisma.team.create({
                            data: {
                                name: tName,
                                tenantId: tenant.id
                            }
                        });
                        // Update local cache
                        existingTeams.push(team);
                    }

                    matchedTeamIds.push(team.id);
                    // If user is a manager, they manage these teams
                    if (role === Role.PLATFORM_MANAGER || normalizedRole.includes('manager')) {
                        managedTeamIds.push(team.id);
                    }
                }

                // 3. Generate Temporary Password
                const tempPassword = Math.random().toString(36).substring(2, 10);
                const hashedPassword = await bcrypt.hash(tempPassword, 10);

                // 4. Upsert User
                const user = await prisma.user.upsert({
                    where: { email_tenantId: { email: email.toLowerCase(), tenantId: tenant.id } },
                    update: {
                        name,
                        role,
                        teams: {
                            set: matchedTeamIds.map(id => ({ id }))
                        },
                        managedTeams: {
                            set: managedTeamIds.map(id => ({ id }))
                        }
                    },
                    create: {
                        email: email.toLowerCase(),
                        name,
                        password: hashedPassword,
                        role,
                        tenantId: tenant.id,
                        teams: {
                            connect: matchedTeamIds.map(id => ({ id }))
                        },
                        managedTeams: {
                            connect: managedTeamIds.map(id => ({ id }))
                        }
                    }
                });

                // 5. Auto-Enrollment for new users or added teams
                if (matchedTeamIds.length > 0) {
                    const assignedCourses = await prisma.teamCourseAssignment.findMany({
                        where: { teamId: { in: matchedTeamIds } },
                        select: { courseId: true }
                    });
                    const uniqueCourseIds = Array.from(new Set(assignedCourses.map(ac => ac.courseId)));
                    if (uniqueCourseIds.length > 0) {
                        await prisma.enrollment.createMany({
                            data: uniqueCourseIds.map(cid => ({
                                userId: user.id,
                                courseId: cid,
                                status: 'ACTIVE'
                            })),
                            skipDuplicates: true
                        });
                    }
                }

                results.push({
                    name,
                    email: email.toLowerCase(),
                    role,
                    status: 'success',
                    password: tempPassword, // Return raw password for the CSV report
                    isNew: true // We can't easily tell with upsert if it was a create or update without extra step, but for CSV we provide it
                });

            } catch (err: any) {
                results.push({
                    email: userData.email,
                    status: 'error',
                    error: err.message
                });
            }
        }

        // Audit Log: Bulk Import
        const session = await checkSession(req, domain);
        if (session) {
            await prisma.activityLog.create({
                data: {
                    userId: session.id,
                    action: 'BULK_USER_IMPORT',
                    metadata: {
                        count: results.filter(r => r.status === 'success').length,
                        errors: results.filter(r => r.status === 'error').length
                    }
                }
            });
        }

        return NextResponse.json({
            success: true,
            results,
            message: `Processed ${users.length} users.`
        });

    } catch (error: any) {
        console.error('Bulk API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
