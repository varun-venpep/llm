import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string; id: string }> }
) {
    try {
        const { domain, id } = await params;

        const tenant = await prisma.tenant.findUnique({
            where: { subdomain: domain },
            select: { id: true }
        });

        if (!tenant) {
            return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
        }

        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                teams: true,
                managedTeams: true,
                jobRoles: true,
                enrollments: {
                    include: {
                        course: {
                            include: {
                                modules: {
                                    include: {
                                        lessons: {
                                            select: { id: true }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                progress: {
                    where: { completed: true },
                    select: { lessonId: true }
                },
                quizAttempts: {
                    select: { score: true }
                },
                activityLogs: {
                    take: 20,
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!user || user.tenantId !== tenant.id) {
            return NextResponse.json({ error: "User not found in this workspace" }, { status: 404 });
        }

        // Calculate progress for each enrollment
        const detailedEnrollments = user.enrollments.map((en: any) => {
            const courseLessons = en.course.modules.flatMap((m: any) => m.lessons.map((l: any) => l.id));
            const totalLessons = courseLessons.length;
            const completedLessons = user.progress.filter((p: any) => courseLessons.includes(p.lessonId)).length;
            const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

            return {
                ...en,
                totalLessons,
                completedLessons,
                progressPercentage
            };
        });

        return NextResponse.json({
            ...user,
            enrollments: detailedEnrollments
        });
    } catch (error) {
        console.error("[USER_AUDIT_DETAIL]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
