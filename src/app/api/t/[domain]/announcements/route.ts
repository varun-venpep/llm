import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkSession } from '@/lib/auth';

// GET all announcements for a tenant
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    const { domain } = await params;
    try {
        console.log('[GET announcements] Domain:', domain);
        const tenant = await prisma.tenant.findUnique({ where: { subdomain: domain } });
        if (!tenant) {
            console.log('[GET announcements] Tenant not found for subdomain:', domain);
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }
        console.log('[GET announcements] Tenant found:', tenant.id);

        const session = await checkSession(req, domain);
        console.log('[GET announcements] Session:', session ? session.id : 'null');
        let readAnnouncementIds = new Set<string>();

        if (session) {
            try {
                const reads = await prisma.announcementRead.findMany({
                    where: { userId: session.id },
                    select: { announcementId: true }
                });
                readAnnouncementIds = new Set(reads.map((r: { announcementId: string }) => r.announcementId));
                console.log('[GET announcements] Read announcements count:', readAnnouncementIds.size);
            } catch (readError) {
                console.error('[GET announcements] Failed to query announcementRead table:', readError);
            }
        }

        let announcements = [];
        try {
            announcements = await prisma.announcement.findMany({
                where: { tenantId: tenant.id },
                orderBy: { createdAt: 'desc' }
            });
            console.log('[GET announcements] Total announcements found:', announcements.length);
        } catch (annError) {
            console.error('[GET announcements] Failed to query announcement table:', annError);
        }

        const formatted = announcements.map(announcement => ({
            ...announcement,
            isRead: readAnnouncementIds.has(announcement.id)
        }));

        return NextResponse.json(formatted);
    } catch (e) {
        console.error('[GET announcements] General error in announcements route:', e);
        return NextResponse.json({ error: 'Internal server error', details: e instanceof Error ? e.message : String(e) }, { status: 500 });
    }
}

// POST create announcement
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    const { domain } = await params;
    try {
        const { title, body, imageUrl, documentUrl } = await req.json();
        const tenant = await prisma.tenant.findUnique({ where: { subdomain: domain } });
        if (!tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const announcement = await prisma.announcement.create({
            data: { title, body, imageUrl, documentUrl, tenantId: tenant.id }
        });
        return NextResponse.json(announcement, { status: 201 });
    } catch (e) {
        console.error('Error creating announcement:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE announcement
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    try {
        await prisma.announcement.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
