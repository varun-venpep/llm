import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    try {
        const { domain } = await params;
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { subdomain: domain }
        });
        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        const user = await prisma.user.findFirst({
            where: { id: userId, tenantId: tenant.id },
            select: {
                id: true,
                name: true,
                email: true
            }
        });

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        return NextResponse.json(user);

    } catch (error) {
        console.error('Profile Fetch Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    try {
        const { domain } = await params;
        const body = await req.json();
        const { userId, currentPassword, newPassword } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { subdomain: domain }
        });
        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        const user = await prisma.user.findFirst({
            where: { id: userId, tenantId: tenant.id }
        });

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const updateData: any = {};

        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json({ error: 'Current password is required to set a new one' }, { status: 400 });
            }
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
            }
            updateData.password = await bcrypt.hash(newPassword, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Profile updated successfully',
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email
            }
        });

    } catch (error) {
        console.error('Profile Update Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
