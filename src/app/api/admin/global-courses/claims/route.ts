import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const claims = await prisma.marketplaceClaim.findMany({
            include: {
                tenant: { select: { name: true, subdomain: true } },
                course: { select: { title: true, isGlobal: true } }
            },
            orderBy: { claimedAt: 'desc' }
        });
        
        return NextResponse.json(claims);
    } catch (e) {
        console.error('Failed to fetch marketplace claims:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
