import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkSession } from '@/lib/auth';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string; teamId: string }> }
) {
    try {
        const { domain, teamId } = await params;
        const tenant = await prisma.tenant.findUnique({ where: { subdomain: domain } });
        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        const session = await checkSession(req, domain);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // 1. Verify access (must be a team manager)
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: {
                managers: { select: { id: true } },
                members: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        jobRoles: { select: { name: true } }
                    }
                },
                courseAssignments: {
                    include: {
                        course: {
                            include: {
                                modules: {
                                    include: { lessons: { select: { id: true } } }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!team || team.tenantId !== tenant.id) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        if (!team.managers.some((m: any) => m.id === session.id)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Process Stats
        const members = team.members;
        const assignments = team.courseAssignments.map((a: any) => a.course);

        // Fetch all progress for these members and courses in one go (batching optimization)
        const courseIds = assignments.map((c: any) => c.id);
        const memberIds = members.map((m: any) => m.id);

        const enrollments = await prisma.enrollment.findMany({
            where: {
                userId: { in: memberIds },
                courseId: { in: courseIds }
            },
            include: {
                user: { select: { id: true } },
                course: { select: { id: true } }
            }
        });

        // Map progress for each enrollment
        const stats = await Promise.all(assignments.map(async (course: any) => {
            const totalLessons = course.modules.reduce((sum: number, m: any) => sum + m.lessons.length, 0);
            
            const memberStats = await Promise.all(members.map(async (member: any) => {
                // Find lesson progress for this user in this course
                const progressCount = await prisma.lessonProgress.count({
                    where: {
                        userId: member.id,
                        lesson: { module: { courseId: course.id } },
                        completed: true
                    }
                });

                const percentage = totalLessons > 0 ? Math.round((progressCount / totalLessons) * 100) : 0;
                
                return {
                    userId: member.id,
                    name: member.name,
                    email: member.email,
                    progress: percentage,
                    isCompleted: percentage === 100
                };
            }));

            const avgProgress = memberStats.length > 0 
                ? Math.round(memberStats.reduce((sum: number, m: any) => sum + m.progress, 0) / memberStats.length)
                : 0;

            const completionRate = memberStats.length > 0
                ? Math.round((memberStats.filter((m: any) => m.isCompleted).length / memberStats.length) * 100)
                : 0;

            return {
                id: course.id,
                title: course.title,
                thumbnail: course.thumbnail,
                totalLessons,
                avgProgress,
                completionRate,
                memberStats
            };
        }));

        return NextResponse.json({
            teamName: team.name,
            totalMembers: members.length,
            courseStats: stats
        });

    } catch (error) {
        console.error('Stats fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
