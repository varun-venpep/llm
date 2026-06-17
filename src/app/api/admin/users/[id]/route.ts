import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

async function isSuperAdmin(req: NextRequest) {
    const sessionId = req.cookies.get('session-token')?.value;
    if (!sessionId) return false;
    const user = await prisma.user.findUnique({
        where: { id: sessionId },
        select: { role: true }
    });
    return user?.role === 'SUPER_ADMIN';
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const sessionId = req.cookies.get('session-token')?.value;
    if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const currentUser = await prisma.user.findUnique({
        where: { id: sessionId },
        select: { role: true }
    });

    if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'PLATFORM_MANAGER')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { id } = await params;
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                tenant: { select: { id: true, name: true, subdomain: true } },
                enrollments: {
                    include: {
                        course: {
                            select: {
                                id: true,
                                title: true,
                                modules: {
                                    where: { isActive: true },
                                    include: {
                                        lessons: { where: { isActive: true }, select: { id: true } }
                                    }
                                }
                            }
                        }
                    }
                },
                progress: true,
                activityLogs: { orderBy: { createdAt: 'desc' }, take: 50 }
            }
        });

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        const { password, ...safeUser } = user;
        return NextResponse.json(safeUser);
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!(await isSuperAdmin(req))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    try {
        const { id } = await params;
        const body = await req.json();
        const { name, email, role, isActive, password } = body;

        const data: any = {};
        if (name !== undefined) data.name = name;
        if (email !== undefined) data.email = email;
        if (role !== undefined) data.role = role as any;
        if (isActive !== undefined) data.isActive = isActive;
        if (password) data.password = await bcrypt.hash(password, 10);

        const updatedUser = await prisma.user.update({ where: { id }, data });
        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!(await isSuperAdmin(req))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const sessionId = req.cookies.get('session-token')?.value;
    const { id } = await params;

    if (id === sessionId) return NextResponse.json({ error: 'Cannot delete own account' }, { status: 400 });

    try {
        await prisma.user.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
