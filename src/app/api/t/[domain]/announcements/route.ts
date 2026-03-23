import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all announcements for a tenant
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    const { domain } = await params;
    try {
        const tenant = await prisma.tenant.findUnique({ where: { subdomain: domain } });
        if (!tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const announcements = await prisma.announcement.findMany({
            where: { tenantId: tenant.id },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(announcements);
    } catch (e) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
