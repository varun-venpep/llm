import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ domain: string }> }
) {
    try {
        const { domain } = await params;
        const tenant = await prisma.tenant.findUnique({
            where: { subdomain: domain },
        });

        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        const templates = await prisma.certificateTemplate.findMany({
            where: { tenantId: tenant.id },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(templates);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch certificate templates' }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ domain: string }> }
) {
    try {
        const { domain } = await params;
        const body = await request.json();
        const { name, designFields, isActive = true } = body;

        const tenant = await prisma.tenant.findUnique({
            where: { subdomain: domain },
        });

        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        const template = await prisma.certificateTemplate.create({
            data: {
                name,
                designFields,
                isActive,
                tenantId: tenant.id,
            },
        });

        return NextResponse.json(template);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create certificate template' }, { status: 500 });
    }
}
