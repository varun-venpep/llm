import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    try {
        const { domain } = await params;
        const body = await req.json();
        const { userId, action, metadata } = body;

        if (!userId || !action) {
            return NextResponse.json({ error: 'userId and action are required' }, { status: 400 });
        }

        // Verify user exists and belongs to tenant
        const user = await prisma.user.findFirst({
            where: {
                id: userId,
                tenant: { subdomain: domain }
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const log = await prisma.activityLog.create({
            data: {
                userId,
                action,
                metadata: metadata || {},
            },
        });

        return NextResponse.json({ success: true, logId: log.id });
    } catch (error) {
        console.error('Failed to log activity:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
