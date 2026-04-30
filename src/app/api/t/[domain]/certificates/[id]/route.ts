import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string, id: string }> }
) {
    const { domain, id } = await params;
    try {
        const tenant = await prisma.tenant.findUnique({
            where: { subdomain: domain }
        });
        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        const body = await req.json();
        const { name, backgroundImage, designFields, isActive } = body;

        // Check if template belongs to this tenant or is global (can only patch if not global here)
        const template = await prisma.certificateTemplate.findUnique({
            where: { id }
        });

        if (!template || template.isGlobal || template.tenantId !== tenant.id) {
            return NextResponse.json({ error: 'Permission denied or template not found' }, { status: 403 });
        }

        const updated = await prisma.certificateTemplate.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(backgroundImage !== undefined && { backgroundImage }),
                ...(designFields && { designFields }),
                ...(isActive !== undefined && { isActive })
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Certificate template update error:", error);
        return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string, id: string }> }
) {
    const { domain, id } = await params;
    try {
        const tenant = await prisma.tenant.findUnique({
            where: { subdomain: domain }
        });
        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        const template = await prisma.certificateTemplate.findUnique({
            where: { id }
        });

        if (!template || template.isGlobal || template.tenantId !== tenant.id) {
            return NextResponse.json({ error: 'Permission denied or template not found' }, { status: 403 });
        }

        await prisma.certificateTemplate.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Certificate template delete error:", error);
        return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
    }
}
