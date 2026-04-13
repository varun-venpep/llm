import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Helper to check if the user is a Super Admin
async function isSuperAdmin(req: NextRequest) {
    const sessionId = req.cookies.get('session-token')?.value;
    if (!sessionId) return false;

    try {
        const user = await prisma.user.findUnique({
            where: { id: sessionId },
            select: { role: true }
        });
        return user?.role === 'SUPER_ADMIN';
    } catch (e) {
        return false;
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') || 'stats';
    const query = searchParams.get('q') || '';

    // Secure the API: Only Super Admins or Platform Managers can access global registry
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
        if (mode === 'stats') {
            const stats = await prisma.user.groupBy({
                by: ['role'],
                _count: {
                    id: true
                }
            });

            const formattedStats = {
<<<<<<< HEAD
                SUPER_ADMIN: stats.find((s: any) => s.role === 'SUPER_ADMIN')?._count.id || 0,
                PLATFORM_MANAGER: stats.find((s: any) => s.role === 'PLATFORM_MANAGER')?._count.id || 0,
                TENANT_ADMIN: stats.find((s: any) => s.role === 'TENANT_ADMIN')?._count.id || 0,
                LEARNER: stats.find((s: any) => s.role === 'LEARNER')?._count.id || 0,
                INSTRUCTOR: stats.find((s: any) => s.role === 'INSTRUCTOR')?._count.id || 0,
=======
                SUPER_ADMIN: stats.find(s => s.role === 'SUPER_ADMIN')?._count.id || 0,
                PLATFORM_MANAGER: stats.find(s => s.role === 'PLATFORM_MANAGER')?._count.id || 0,
                TENANT_ADMIN: stats.find(s => s.role === 'TENANT_ADMIN')?._count.id || 0,
                LEARNER: stats.find(s => s.role === 'LEARNER')?._count.id || 0,
                INSTRUCTOR: stats.find(s => s.role === 'INSTRUCTOR')?._count.id || 0,
>>>>>>> main
            };

            return NextResponse.json(formattedStats);
        }

        if (mode === 'staff') {
            const staff = await prisma.user.findMany({
                where: {
                    role: { in: ['SUPER_ADMIN', 'PLATFORM_MANAGER'] as any }
                },
                include: {
                    tenant: {
                        select: {
                            id: true,
                            name: true,
                            subdomain: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            return NextResponse.json(staff);
        }

        if (mode === 'search') {
            if (!query) return NextResponse.json([]);

            const users = await prisma.user.findMany({
                where: {
                    OR: [
                        { email: { contains: query, mode: 'insensitive' } },
                        { name: { contains: query, mode: 'insensitive' } },
                        { id: { equals: query } }
                    ]
                },
                include: {
                    tenant: {
                        select: {
                            id: true,
                            name: true,
                            subdomain: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 50
            });

            return NextResponse.json(users);
        }

        return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    } catch (error) {
        console.error('Global users API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    if (!(await isSuperAdmin(req))) {
        return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { email, name, role } = body;

        if (!email || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Check if user already exists
        const existing = await prisma.user.findFirst({
            where: { email }
        });

        if (existing) {
            return NextResponse.json({ error: 'User already exists with this email' }, { status: 400 });
        }

        // 2. Identify System Tenant
        const systemTenant = await prisma.tenant.findFirst({
            where: { subdomain: 'admin-system' }
        });

        if (!systemTenant) {
            return NextResponse.json({ error: 'System architecture mismatch (admin-system tenant not found)' }, { status: 500 });
        }

        // 3. Create User
        const hashedPassword = await bcrypt.hash('password123', 10);
        const newUser = await prisma.user.create({
            data: {
                email,
                name: name || email.split('@')[0],
                password: hashedPassword,
                role: role as any,
                tenantId: systemTenant.id,
                isActive: true
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Platform staff created successfully',
            user: { id: newUser.id, email: newUser.email, role: newUser.role } 
        });

    } catch (error) {
        console.error('Staff creation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
