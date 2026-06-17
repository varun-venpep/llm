import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkSession, requireTenantPermission } from '@/lib/auth';

// GET all courses for a tenant
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    const { domain } = await params;
    try {
        const tenant = await prisma.tenant.findUnique({ where: { subdomain: domain } });
        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        const { searchParams } = new URL(req.url);
        const view = searchParams.get('view');
        let sessionUser: any = null;

        if (view !== 'learner') {
            const session = await checkSession(req, domain, ['TENANT_ADMIN', 'SUPER_ADMIN']);
            if (!requireTenantPermission(session, 'courses.manage')) {
                return NextResponse.json({ error: 'You do not have permission to view courses' }, { status: 403 });
            }
        }

        // For learner view, filter role and team exclusive courses
        let visibilityFilter = {};
        if (view === 'learner') {
            const session = await checkSession(req, domain);
            sessionUser = session;
            if (session) {
                const user = await prisma.user.findUnique({
                    where: { id: session.id },
                    select: {
                        jobRoles: {
                            where: { isActive: true },
                            select: { id: true }
                        },
                        teams: {
                            where: { isActive: true },
                            select: { id: true }
                        },
                        role: true
                    }
                });
                const userTeamIds = user?.teams.map(t => t.id) || [];
                const activeJobRoleIds = user?.jobRoles?.map(r => r.id) || [];

                // 2b. If learner, only show Marketplace courses if their team is assigned!
                const assignments = await prisma.teamCourseAssignment.findMany({
                    where: { teamId: { in: userTeamIds } },
                    select: { courseId: true }
                });
                const assignedMarketplaceIds = assignments.map(a => a.courseId);

                // Visible if (role matches OR role is null) AND (team matches OR team is null)
                // AND (isMarketplace matches assignment OR isMarketplace is false)
                visibilityFilter = {
                    AND: [
                        { OR: [{ exclusiveRoleId: null }, { exclusiveRoleId: { in: activeJobRoleIds.length > 0 ? activeJobRoleIds : ['no-role'] } }] },
                        { OR: [{ exclusiveTeamId: null }, { exclusiveTeamId: { in: userTeamIds } }] },
                        {
                            OR: [
                                { isMarketplace: false },
                                { AND: [{ isMarketplace: true }, { id: { in: assignedMarketplaceIds } }] }
                            ]
                        }
                    ]
                };
            } else {
                // If not logged in, only show public courses
                visibilityFilter = {
                    exclusiveRoleId: null,
                    exclusiveTeamId: null
                };
            }
        }

        const courses = await prisma.course.findMany({
            where: {
                tenantId: tenant.id,
                ...(view === 'learner' ? { isPublished: true, ...visibilityFilter } : {})
            },
            include: {
                modules: {
                    include: { lessons: true },
                    orderBy: { order: 'asc' }
                },
                _count: { select: { enrollments: true } },
                exclusiveRole: { select: { id: true, name: true } },
                exclusiveTeam: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        const session = sessionUser;
        let completedLessonIds = new Set<string>();

        if (session) {
            const userProgress = await prisma.lessonProgress.findMany({
                where: {
                    userId: session.id,
                    completed: true,
                    lesson: {
                        module: {
                            course: {
                                tenantId: tenant.id
                            }
                        }
                    }
                },
                select: {
                    lessonId: true
                }
            });
            completedLessonIds = new Set(userProgress.map((p: { lessonId: string }) => p.lessonId));
        }

        const coursesWithStatus = courses.map(course => {
            if (view !== 'learner') return course;

            const allLessons = course.modules.flatMap(m => m.lessons.filter(l => l.isActive));
            const totalLessons = allLessons.length;
            
            if (totalLessons === 0) {
                return { ...course, status: 'NEW', progressPercentage: 0 };
            }

            const completedCount = allLessons.filter(l => completedLessonIds.has(l.id)).length;
            const progressPercentage = Math.round((completedCount / totalLessons) * 100);

            let status = 'NEW';
            if (completedCount > 0) {
                status = completedCount === totalLessons ? 'COMPLETED' : 'IN_PROGRESS';
            }

            return {
                ...course,
                status,
                progressPercentage
            };
        });

        return NextResponse.json(coursesWithStatus);
    } catch (e) {
        console.error('Failed to fetch courses:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST create a new course
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    const { domain } = await params;
    try {
        const body = await req.json();
        const {
            title, description, thumbnail, skillLevel, languages, captions,
            isMarketplace, exclusiveRoleId, exclusiveTeamId,
            certificateEnabled, certificateTemplateId
        } = body;

        const tenant = await prisma.tenant.findUnique({ where: { subdomain: domain } });
        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        const session = await checkSession(req, domain, ['TENANT_ADMIN', 'SUPER_ADMIN']);
        if (!requireTenantPermission(session, 'courses.manage')) {
            return NextResponse.json({ error: 'You do not have permission to create courses' }, { status: 403 });
        }

        // Rule: exclusive courses cannot appear in the marketplace
        const effectiveIsMarketplace = (exclusiveRoleId || exclusiveTeamId) ? false : (isMarketplace || false);

        const course = await prisma.course.create({
            data: {
                title,
                description,
                thumbnail,
                skillLevel,
                languages,
                captions,
                isMarketplace: effectiveIsMarketplace,
                exclusiveRoleId: exclusiveRoleId || null,
                exclusiveTeamId: exclusiveTeamId || null,
                certificateEnabled: certificateEnabled || false,
                certificateTemplateId: certificateTemplateId || null,
                tenantId: tenant.id
            }
        });

        if (session) {
            await prisma.activityLog.create({
                data: {
                    userId: session.id,
                    action: 'COURSE_CREATED',
                    metadata: { courseId: course.id, title: course.title }
                }
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Course created successfully',
            data: course
        }, { status: 201 });
    } catch (e) {
        console.error('Failed to create course:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT update an existing course
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    const { domain } = await params;
    try {
        const body = await req.json();
        const {
            id, title, description, thumbnail, skillLevel, languages, captions,
            isMarketplace, exclusiveRoleId, exclusiveTeamId,
            certificateEnabled, certificateTemplateId
        } = body;

        if (!id) return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });

        const tenant = await prisma.tenant.findUnique({ where: { subdomain: domain } });
        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        const session = await checkSession(req, domain, ['TENANT_ADMIN', 'SUPER_ADMIN']);
        if (!requireTenantPermission(session, 'courses.manage')) {
            return NextResponse.json({ error: 'You do not have permission to update courses' }, { status: 403 });
        }

        // Rule: exclusive courses cannot appear in the marketplace
        const effectiveIsMarketplace = (exclusiveRoleId || exclusiveTeamId) ? false : (isMarketplace || false);

        const course = await prisma.course.update({
            where: { id, tenantId: tenant.id },
            data: {
                ...(title && { title }),
                description: description ?? null,
                thumbnail: thumbnail ?? null,
                ...(skillLevel && { skillLevel }),
                ...(languages && { languages }),
                ...(captions !== undefined && { captions }),
                isMarketplace: effectiveIsMarketplace,
                exclusiveRoleId: exclusiveRoleId || null,
                exclusiveTeamId: exclusiveTeamId || null,
                certificateEnabled: certificateEnabled !== undefined ? certificateEnabled : undefined,
                certificateTemplateId: certificateTemplateId !== undefined ? (certificateTemplateId || null) : undefined
            }
        });

        // Audit Log: Course Update
        if (session) {
            await prisma.activityLog.create({
                data: {
                    userId: session.id,
                    action: 'COURSE_UPDATED',
                    metadata: { courseId: course.id, title: course.title }
                }
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Course updated successfully',
            data: course
        });
    } catch (e) {
        console.error('Failed to update course:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
