import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password } = body;

        // The super admin user doesn't belong to a tenant.
        const user = await prisma.user.findFirst({
            where: {
                email,
                role: 'SUPER_ADMIN'
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
        }

        // In a real application, you would sign a session/JWT here
        return NextResponse.json({
            success: true,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });

    } catch (error) {
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
}
