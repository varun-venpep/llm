import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkSession, requireTenantPermission } from '@/lib/auth';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    const { domain } = await params;
    try {
        // BUG-003: Require a valid session to view certificates
        const session = await checkSession(req, domain, ['TENANT_ADMIN', 'SUPER_ADMIN']);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { subdomain: domain }
        });
        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        // Fetch both global and tenant-specific templates
        const templates = await prisma.certificateTemplate.findMany({
            where: {
                OR: [
                    { isGlobal: true },
                    { tenantId: tenant.id }
                ]
            }
        });

        return NextResponse.json(templates);
    } catch (error: any) {
        console.error("Tenant certificates fetch error:", error);
        return NextResponse.json({ 
            error: 'Failed to fetch templates', 
            details: error?.message || String(error)
        }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    const { domain } = await params;
    try {
        // BUG-003: Require a valid admin session for creating templates
        const session = await checkSession(req, domain, ['TENANT_ADMIN', 'SUPER_ADMIN']);
        if (!session || !requireTenantPermission(session, 'certificates.manage')) {
            return NextResponse.json({ error: 'Unauthorized — certificates.manage permission required' }, { status: 401 });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { subdomain: domain }
        });
        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        const body = await req.json();
        const { name, backgroundImage, designFields, isDuplicateOf } = body;

        // If duplicateOf is provided, we copy the designFields from that template
        let finalDesignFields = designFields || {};
        if (isDuplicateOf) {
            const sourceTemplate = await prisma.certificateTemplate.findUnique({
                where: { id: isDuplicateOf }
            });
            if (sourceTemplate) {
                finalDesignFields = sourceTemplate.designFields || {};
            }
        }

        const template = await prisma.certificateTemplate.create({
            data: {
                name: name || "New Certificate Template",
                backgroundImage: backgroundImage || "",
                designFields: finalDesignFields,
                tenantId: tenant.id,
                isGlobal: false
            }
        });

        return NextResponse.json(template);
    } catch (error) {
        console.error("Tenant certificate creation error:", error);
        return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
    }
}
