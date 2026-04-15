import { ReactNode } from 'react';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import '@/app/globals.css';

interface LayoutProps {
    children: ReactNode;
    params: Promise<{ domain: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }): Promise<Metadata> {
    const { domain } = await params;
    const tenant = await prisma.tenant.findUnique({
        where: { subdomain: domain }
    });

    return {
        title: tenant?.name ? `${tenant.name} | LMS` : 'LMS Workspace',
        description: `Your custom training ecosystem.`,
        icons: {
            icon: `/t/${domain}/icon`,
        }
    };
}

export default async function TenantLayout({ children, params }: LayoutProps) {
    const { domain } = await params;

    // We can also fetch branding colors here and inject them as CSS variables if needed
    const tenant = await prisma.tenant.findUnique({
        where: { subdomain: domain }
    });

    const primaryColor = (tenant as any)?.primaryColor || '#3b82f6';
    const secondaryColor = '#1f2937'; // Consistent dark theme secondary

    return (
        <div
            className="min-h-screen bg-background"
            style={{
                '--primary-brand': primaryColor,
                '--secondary-brand': secondaryColor
            } as any}
        >
            {children}
        </div>
    );
}
