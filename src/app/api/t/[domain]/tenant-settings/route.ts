import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET tenant settings (public fields only) for the Tenant Admin UI
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    const { domain } = await params;
    try {
        const tenant = await prisma.tenant.findUnique({
            where: { subdomain: domain },
            select: {
                id: true,
                name: true,
                subdomain: true,
                globalMarketplaceEnabled: true,
                courseCredits: true,
                aiCredits: true,
                plan: true,
                isActive: true
            }
        });

        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        return NextResponse.json(tenant);
    } catch (e) {
        console.error('Failed to fetch tenant settings:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
