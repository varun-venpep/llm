import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkSession } from '@/lib/auth';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    try {
        const { domain } = await params;
        const tenant = await prisma.tenant.findUnique({ where: { subdomain: domain } });
        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        const session = await checkSession(req, domain);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { teamId, courseId, allTeams } = await req.json();

        if (!courseId || (!teamId && !allTeams)) {
            return NextResponse.json({ error: 'Course ID and target (Team or All Teams) are required' }, { status: 400 });
        }

        // 1. Identify target teams
        let targetTeamIds: string[] = [];
        if (allTeams) {
            const managedTeams = await prisma.team.findMany({
                where: {
                    tenantId: tenant.id,
                    managers: { some: { id: session.id } }
                },
                select: { id: true }
            });
            targetTeamIds = managedTeams.map(t => t.id);
        } else if (teamId) {
            // Verify single team management
            const isManager = await prisma.team.findFirst({
                where: {
                    id: teamId,
                    tenantId: tenant.id,
                    managers: { some: { id: session.id } }
                }
            });
            if (!isManager) return NextResponse.json({ error: 'Forbidden: You do not manage this team' }, { status: 403 });
            targetTeamIds = [teamId];
        }

        if (targetTeamIds.length === 0) {
            return NextResponse.json({ error: 'No managed teams found to assign.' }, { status: 400 });
        }

        // 2. Perform assignments and collect learners
        const totalLearners = new Set<string>();

        for (const tid of targetTeamIds) {
            // Persistent assignment record
            await prisma.teamCourseAssignment.upsert({
                where: { teamId_courseId: { teamId: tid, courseId } },
                update: {},
                create: { teamId: tid, courseId, assignedById: session.id }
            });

            // Get team members for enrollment
            const team = await prisma.team.findUnique({
                where: { id: tid },
                select: { members: { select: { id: true } } }
            });
            team?.members.forEach(m => totalLearners.add(m.id));
        }

        // 3. Process enrollments in bulk
        const learnerIds = Array.from(totalLearners);
        const existingEnrollments = await prisma.enrollment.findMany({
            where: { courseId, userId: { in: learnerIds } },
            select: { userId: true }
        });
        const existingIds = new Set(existingEnrollments.map(e => e.userId));
        const newIds = learnerIds.filter(id => !existingIds.has(id));

        if (newIds.length > 0) {
            await prisma.enrollment.createMany({
                data: newIds.map(uid => ({
                    userId: uid,
                    courseId,
                    status: 'ACTIVE'
                }))
            });
        }

        return NextResponse.json({
            success: true,
            message: `Successfully assigned course to ${newIds.length} new learners and updated team curriculum.`
        });

    } catch (error) {
        return NextResponse.json({ error: 'Failed to assign course' }, { status: 500 });
    }
}
