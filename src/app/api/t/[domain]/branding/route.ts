import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    try {
        const { domain } = await params;
        
        const tenant = await prisma.tenant.findUnique({
            where: { subdomain: domain },
            select: {
                name: true,
                primaryColor: true,
                logoLight: true,
                logoDark: true,
                favicon: true
            }
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        return NextResponse.json(tenant);
    } catch (error) {
        console.error('[BRANDING_PUBLIC_GET]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
