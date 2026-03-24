'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function RootLoginPage() {
    const router = useRouter();

    useEffect(() => {
        // Since we are on the Root Domain, the only valid login is the /admin/login portal
        // Tenants/Students should use their own subdomain URL to access the site.
        router.replace('/admin/login');
    }, [router]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Identifying Workspace...</p>
            </div>
        </div>
    );
}
