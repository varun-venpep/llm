'use client';

import { useState, useEffect } from 'react';
import { Search, MoreVertical, Building2, CheckCircle2, ShieldCheck } from 'lucide-react';

interface Tenant {
    id: string;
    name: string;
    subdomain: string;
    customDomain: string | null;
    isActive: boolean;
    createdAt: string;
    _count: {
        users: number;
        courses: number;
    };
}

export default function TenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            const res = await fetch('/api/admin/tenants');
            const data = await res.json();
            setTenants(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black tracking-tight uppercase">Tenant Management</h1>
                    <p className="text-muted-foreground text-sm font-medium">Manage all active and inactive client workspaces across the platform.</p>
                </div>
            </div>

            <div className="glassmorphism rounded-2xl overflow-hidden border border-border/50">
                <div className="p-6 border-b border-border/50 flex justify-between items-center bg-secondary/20">
                    <h2 className="font-bold flex items-center gap-2"><Building2 className="w-5 h-5 text-blue-500" /> All Deployments</h2>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search organizations..."
                            className="bg-background/50 border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-64"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-border/50 bg-secondary/10">
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Workspace</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Domain</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Stats</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Created</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-20 font-medium text-muted-foreground italic">Syncing with cloud...</td></tr>
                            ) : tenants.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-20 font-medium text-muted-foreground italic">No active deployments found.</td></tr>
                            ) : tenants.map((tenant) => (
                                <tr key={tenant.id} className="hover:bg-secondary/20 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-black text-blue-400">
                                                {tenant.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <span className="font-bold block">{tenant.name}</span>
                                                <span className="text-xs text-muted-foreground">ID: {tenant.id.substring(0, 8)}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-sm text-blue-400 hover:underline cursor-pointer">
                                        {tenant.subdomain}.lms.com
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-mono text-xs">{tenant._count.users} Users</span>
                                            <span className="font-mono text-xs text-muted-foreground">{tenant._count.courses} Courses</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {tenant.subdomain === 'admin-system' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold uppercase">
                                                <ShieldCheck className="w-3 h-3" /> System Core
                                            </span>
                                        ) : tenant.isActive ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">
                                                <CheckCircle2 className="w-3 h-3" /> Online
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase">
                                                Offline
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(tenant.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 rounded-lg hover:bg-background transition-colors text-muted-foreground hover:text-foreground">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
