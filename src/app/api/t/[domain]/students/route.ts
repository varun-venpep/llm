import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    try {
        const { domain } = await params;
        const body = await req.json();
        const { email, name, password } = body;

        const tenant = await prisma.tenant.findUnique({
            where: { subdomain: domain },
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const student = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role: 'STUDENT',
                tenantId: tenant.id,
            },
        });

        return NextResponse.json({
            success: true,
            studentId: student.id,
            message: 'Student created successfully'
        });

    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Student email already exists in this workspace' }, { status: 400 });
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
        const students = await prisma.user.findMany({
            where: {
                tenant: { subdomain: domain },
                role: 'STUDENT',
            },
            include: {
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
        return NextResponse.json(students);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    try {
        const { domain } = await params;
        const body = await req.json();
        const { studentId, newPassword, isActive, name, email } = body;
 
        const tenant = await prisma.tenant.findUnique({
            where: { subdomain: domain }
        });
 
        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
 
        const updateData: any = {};
        if (newPassword) {
            updateData.password = await bcrypt.hash(newPassword, 10);
        }
        if (typeof isActive === 'boolean') {
            updateData.isActive = isActive;
        }
 
        await prisma.user.update({
            where: { id: studentId, tenantId: tenant.id },
            data: {
                ...(name && { name }),
                ...(email && { email }),
                ...(newPassword && { password: await bcrypt.hash(newPassword, 10) }),
                ...(typeof isActive === 'boolean' && { isActive })
            }
        });
 
        return NextResponse.json({ success: true, message: 'Student updated successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    try {
        const { domain } = await params;
        const studentId = req.nextUrl.searchParams.get('studentId');

        if (!studentId) {
            return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { subdomain: domain }
        });

        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        // Delete user (Prisma should handle cascade if configured, but we check here)
        await prisma.user.delete({
            where: { id: studentId, tenantId: tenant.id }
        });

        return NextResponse.json({ success: true, message: 'Student deleted successfully' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
    }
}
