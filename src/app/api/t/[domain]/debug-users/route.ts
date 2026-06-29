import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, name: true, role: true, tenantId: true }
        });
        const tenants = await prisma.tenant.findMany();
        return NextResponse.json({
            users,
            tenants
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message, stack: e.stack }, { status: 200 });
    }
}
