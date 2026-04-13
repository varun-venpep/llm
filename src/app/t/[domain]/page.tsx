import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function TenantPage({ params }: { params: Promise<{ domain: string }> }) {
    const resolvedParams = await params;
    const { domain } = resolvedParams;

    // Check if the tenant actually exists
    const tenant = await prisma.tenant.findUnique({
        where: { subdomain: domain },
        select: { id: true }
    });

    if (tenant) {
        redirect('/login');
    } else {
        const rootDomain = process.env.ROOT_DOMAIN || process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'lebra.ai';
        redirect(`https://${rootDomain}/`);
    }

    export default async function TenantPage({ params }: { params: Promise<{ domain: string }> }) {
        const resolvedParams = await params;
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-24">
                <h1 className="text-4xl font-bold">Client Workspace: {resolvedParams.domain}</h1>
                <p className="mt-4 text-xl">Manage your courses and learners here.</p>
            </div>
        );
    }
