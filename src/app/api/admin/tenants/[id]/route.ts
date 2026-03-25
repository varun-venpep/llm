import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await req.json();
        const { name, subdomain, isActive } = body;

        const updatedTenant = await prisma.tenant.update({
            where: { id },
            data: {
                name,
                subdomain,
                isActive
            }
        });

        return NextResponse.json(updatedTenant);
    } catch (error) {
        console.error('Tenant update error:', error);
        return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: tenantId } = await params;
    try {
        const tenant = await prisma.tenant.findUnique({ 
            where: { id: tenantId },
            include: {
                users: { select: { id: true } },
                courses: { select: { id: true } }
            }
        });

        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        if (tenant.subdomain === 'admin-system') {
            return NextResponse.json({ error: 'Cannot delete system core' }, { status: 403 });
        }

        const userIds = tenant.users.map((u: any) => u.id);
        const courseIds = tenant.courses.map((c: any) => c.id);

        // Perform manual cascade delete in a transaction
        await prisma.$transaction(async (tx: any) => {
            // 1. Delete low-level user-related data
            if (userIds.length > 0) {
                await tx.lessonProgress.deleteMany({ where: { userId: { in: userIds } } });
                await tx.quizAttempt.deleteMany({ where: { userId: { in: userIds } } });
                await tx.enrollment.deleteMany({ where: { userId: { in: userIds } } });
                await tx.activityLog.deleteMany({ where: { userId: { in: userIds } } });
                await tx.submission.deleteMany({ where: { userId: { in: userIds } } });
                await tx.issuedCertificate.deleteMany({ where: { userId: { in: userIds } } });
                await tx.note.deleteMany({ where: { userId: { in: userIds } } });
                await tx.review.deleteMany({ where: { userId: { in: userIds } } });
            }

            // 2. Delete tenant-level entities
            await tx.announcement.deleteMany({ where: { tenantId } });
            await tx.certificateTemplate.deleteMany({ where: { tenantId } });
            
            // 3. Delete Courses (Modules/Lessons should cascade if defined in schema, but being safe)
            await tx.course.deleteMany({ where: { tenantId } });
            
            // 4. Delete Users
            await tx.user.deleteMany({ where: { tenantId } });

            // 5. Finally delete the Tenant
            await tx.tenant.delete({ where: { id: tenantId } });
        });

        return NextResponse.json({ success: true, message: 'Tenant and all associated data deleted successfully' });
    } catch (error: any) {
        console.error('Tenant deletion error:', error);
        return NextResponse.json({ error: `Failed to delete tenant: ${error.message}` }, { status: 500 });
    }
}
