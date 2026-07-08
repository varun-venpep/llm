import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkSession } from '@/lib/auth';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    try {
        const { domain } = await params;
        const { announcementId } = await req.json();

        if (!announcementId) {
            return NextResponse.json({ error: 'announcementId is required' }, { status: 400 });
        }

        const session = await checkSession(req, domain);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify the announcement exists
        const announcement = await prisma.announcement.findUnique({
            where: { id: announcementId }
        });

        if (!announcement) {
            return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
        }

        // Mark as read in DB
        const readRecord = await prisma.announcementRead.upsert({
            where: {
                userId_announcementId: {
                    userId: session.id,
                    announcementId
                }
            },
            create: {
                userId: session.id,
                announcementId
            },
            update: {} // No-op if already marked as read
        });

        return NextResponse.json({
            success: true,
            message: 'Announcement marked as read successfully',
            data: readRecord
        });

    } catch (error: any) {
        console.error('Failed to mark announcement as read:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}
