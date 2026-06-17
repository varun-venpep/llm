'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Search, Building2, ShieldCheck, CheckCircle2, ArrowRight, Loader2, UserCircle2 } from 'lucide-react';

interface Stats {
    SUPER_ADMIN: number;
    PLATFORM_MANAGER: number;
    TENANT_ADMIN: number;
    LEARNER: number;
    INSTRUCTOR: number;
}

interface GlobalUser {
    id: string;
    email: string;
    name: string | null;
    role: string;
    createdAt: string;
    tenant: {
        id: string;
        name: string;
        subdomain: string;
    };
}

export default function UsersPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<GlobalUser[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [loadingStats, setLoadingStats] = useState(true);
    const [rootDomain, setRootDomain] = useState('lvh.me:3000');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const host = window.location.host;
            const parts = host.split(':');
            const port = parts[1] ? `:${parts[1]}` : '';
            setRootDomain(host.includes('localhost') || host.includes('127.0.0.1') || host.includes('lvh.me') ? `lvh.me${port}` : `${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'lvh.me'}${port}`);
        }
    }, []);

    useEffect(() => {
        fetchStats();
        handleSearch();
    }, []);

    useEffect(() => {
        if (!query.trim()) handleSearch();
    }, [query]);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/admin/users?mode=stats');
            const data = await res.json();
            setStats(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingStats(false);
        }
    };

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsSearching(true);
        try {
            const res = await fetch(`/api/admin/users?mode=search&q=${encodeURIComponent(query)}`);
            const data = await res.json();
            setResults(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto text-white">
            <div>
                <h1 className="text-2xl font-black tracking-tight uppercase flex items-center gap-3">
                    <div className="bg-purple-500/10 p-2 rounded-xl border border-purple-500/20">
                        <Users className="w-7 h-7 text-purple-500" />
                    </div>
                    Global Identity Registry
                </h1>
                <p className="text-muted-foreground text-sm font-medium mt-1">Cross-tenant auditing and platform-wide user discovery.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                    { label: 'Super Admins', value: stats?.SUPER_ADMIN, color: 'text-purple-400', bg: 'bg-purple-500/10', icon: ShieldCheck },
                    { label: 'Platform Mgrs', value: stats?.PLATFORM_MANAGER, color: 'text-amber-400', bg: 'bg-amber-500/10', icon: CheckCircle2 },
                    { label: 'Tenant Admins', value: stats?.TENANT_ADMIN, color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Building2 },
                    { label: 'Global Learners', value: stats?.LEARNER, color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: UserCircle2 },
                    { label: 'Instructors', value: stats?.INSTRUCTOR, color: 'text-pink-400', bg: 'bg-pink-500/10', icon: CheckCircle2 }
                ].map((item, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 p-5 rounded-2xl transition-all">
                        <div className="flex justify-between items-start mb-3">
                            <div className={`${item.bg} p-1.5 rounded-lg`}>
                                <item.icon className={`w-4 h-4 ${item.color}`} />
                            </div>
                        </div>
                        <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/60 mb-0.5">{item.label}</p>
                        {loadingStats ? (
                            <div className="h-8 w-16 bg-white/5 animate-pulse rounded-lg" />
                        ) : (
                            <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
                        )}
                    </div>
                ))}
            </div>

            <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/10 bg-gradient-to-br from-white/5 to-transparent">
                    <div className="max-w-2xl mx-auto text-center space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold tracking-tight">Cloud Identity Search</h2>
                            <p className="text-sm text-muted-foreground">Scan through isolated client environments to locate a specific user identity.</p>
                        </div>
                        <form onSubmit={handleSearch} className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-purple-400" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search by email, name, or global UID..."
                                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-40 py-4 text-sm focus:outline-none focus:border-purple-500/50"
                            />
                            <button
                                type="submit"
                                disabled={isSearching}
                                className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                            >
                                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Scan Platform'}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="min-h-[300px]">
                    {isSearching ? (
                        <div className="flex flex-col items-center justify-center h-64 space-y-4">
                            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Scanning databases...</p>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-white/5 border-b border-white/10">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">User Identity</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Role</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tenant / Workspace</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Registered</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {results.map((user) => (
                                        <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center font-bold text-xs">
                                                        {user.name ? user.name.substring(0, 2).toUpperCase() : user.email.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm">{user.name || 'Anonymous User'}</p>
                                                        <p className="text-xs text-muted-foreground italic">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${user.role === 'SUPER_ADMIN' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                                    {user.role.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold">{user.tenant.name}</span>
                                                    <span className="text-[10px] text-blue-400 font-mono tracking-tighter">
                                                        {user.tenant.subdomain}.{rootDomain}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    href={`/admin/users/${user.id}`}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase transition-all"
                                                >
                                                    Audit Profile <ArrowRight className="w-3 h-3" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-center p-8 opacity-40">
                            <p className="text-xs font-bold uppercase tracking-widest">Cross-Tenant Search Ready</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
