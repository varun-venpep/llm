import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await req.json();
        const { name, subdomain, isActive } = body;

        const updatedTenant = await prisma.tenant.update({
            where: { id },
            data: {
                name,
                subdomain,
                isActive
            }
        });

        return NextResponse.json(updatedTenant);
    } catch (error) {
        console.error('Tenant update error:', error);
        return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        // We should check if this is the system platform (don't delete that!)
        const tenant = await prisma.tenant.findUnique({ where: { id } });
        if (tenant?.subdomain === 'admin-system') {
            return NextResponse.json({ error: 'Cannot delete system core' }, { status: 403 });
        }

        // Deleting a tenant should ideally delete all related data or at least cascade users
        // But for safety, we'll just try to delete the tenant record and assume prisma handles cascade if configured.
        await prisma.tenant.delete({ where: { id } });

        return NextResponse.json({ success: true, message: 'Tenant deleted successfully' });
    } catch (error: any) {
        console.error('Tenant deletion error:', error);
        if (error.code === 'P2003') {
            return NextResponse.json({ error: 'Cannot delete tenant: it has active courses or students. Please delete those first.' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Failed to delete tenant' }, { status: 500 });
    }
}
