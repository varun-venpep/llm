import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string; resourceId: string }> }
) {
    const { domain, resourceId } = await params;
    try {
        const tenant = await prisma.tenant.findUnique({ where: { subdomain: domain } });
        if (!tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        await prisma.resource.delete({
            where: { id: resourceId }
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('Resource delete error:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
