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
            return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
        }

        return NextResponse.json(tenant);
    } catch (error) {
        console.error("[BRANDING_GET]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    try {
        const { domain } = await params;
        const data = await req.json();

        // Basic validation
        if (!data.name || !data.primaryColor) {
            return NextResponse.json({ error: "Name and Primary Color are required" }, { status: 400 });
        }

        const tenant = await prisma.tenant.update({
            where: { subdomain: domain },
            data: {
                name: data.name,
                primaryColor: data.primaryColor,
                logoLight: data.logoLight,
                logoDark: data.logoDark,
                favicon: data.favicon
            }
        });

        return NextResponse.json({
            success: true,
            message: "Branding updated successfully",
            tenant: {
                name: tenant.name,
                primaryColor: tenant.primaryColor,
                logoLight: tenant.logoLight,
                logoDark: tenant.logoDark,
                favicon: tenant.favicon
            }
        });
    } catch (error) {
        console.error("[BRANDING_PUT]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
