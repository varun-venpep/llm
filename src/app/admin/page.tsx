'use client';

import { ThemeToggle } from "@/components/ThemeToggle";
import { useState, useEffect } from 'react';
import { Building2, Users, BookOpen, TrendingUp, ArrowUpRight, Loader2, Zap, Globe } from 'lucide-react';
import Link from 'next/link';

interface Stats {
    tenantCount: number;
    userCount: number;
    courseCount: number;
    enrollmentCount: number;
    recentTenants: Array<{
        id: string;
        name: string;
        subdomain: string;
        isActive: boolean;
        createdAt: string;
    }>;
}

type RecentTenant = Stats['recentTenants'][number];

interface SpinResult {
    success: boolean;
    tenantId: string;
    message: string;
    tenant?: RecentTenant;
}

type SpinoffFormKey = 'name' | 'subdomain' | 'adminEmail' | 'adminPassword';

interface SpinoffForm {
    name: string;
    subdomain: string;
    adminEmail: string;
    adminPassword: string;
    globalMarketplaceEnabled: boolean;
}

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showSpinoff, setShowSpinoff] = useState(false);
    const [form, setForm] = useState<SpinoffForm>({
        name: '',
        subdomain: '',
        adminEmail: '',
        adminPassword: '',
        globalMarketplaceEnabled: false,
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [spinning, setSpinning] = useState(false);
    const [spinResult, setSpinResult] = useState<SpinResult | null>(null);
    const [spinError, setSpinError] = useState('');

    const fetchStats = async () => {
        try {
            const res = await fetch(`/api/admin/stats?ts=${Date.now()}`, { cache: 'no-store' });
            const data = await res.json();
            setStats(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const addRecentTenant = (tenant?: RecentTenant) => {
        if (!tenant) return;
        setStats(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                tenantCount: tenant.isActive ? prev.tenantCount + 1 : prev.tenantCount,
                userCount: prev.userCount + 1,
                recentTenants: [
                    tenant,
                    ...prev.recentTenants.filter(item => item.id !== tenant.id)
                ].slice(0, 5)
            };
        });
    };

    const verifyTenantCreated = async (tenantId: string) => {
        const res = await fetch(`/api/admin/tenants?ts=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return false;
        const tenants = await res.json() as Array<{ id: string }>;
        return tenants.some(tenant => tenant.id === tenantId);
    };

    useEffect(() => { void Promise.resolve().then(fetchStats); }, []);

    const handleSpinoff = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        const errors: Record<string, string> = {};
        if (!form.name.trim()) errors.name = 'Organization name is required';
        if (!form.subdomain.trim()) errors.subdomain = 'Subdomain is required';
        if (!form.adminEmail.trim()) errors.adminEmail = 'Admin email is required';
        if (!form.adminPassword.trim()) errors.adminPassword = 'Admin password is required';

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setFormErrors({});
        setSpinError('');
        setSpinning(true);
        setSpinResult(null);
        try {
            const res = await fetch('/api/admin/tenants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (res.ok) {
                const createdTenantId = typeof data.tenantId === 'string' ? data.tenantId : '';
                const isVisible = createdTenantId ? await verifyTenantCreated(createdTenantId) : false;
                if (!isVisible) {
                    setSpinError('Workspace creation did not appear in deployments. Please retry after restarting the dev server.');
                    return;
                }
                setSpinResult(data);
                addRecentTenant(data.tenant);
                void fetchStats();
            } else {
                setSpinError(data.error || 'Failed to create workspace');
            }
        } catch (e) {
            console.error(e);
            setSpinError('Failed to create workspace');
        } finally {
            setSpinning(false);
        }
    };

    const statCards = [
        { label: 'Active Deployments', value: stats?.tenantCount ?? '...', icon: Building2, color: 'blue', trend: '+2 this week' },
        { label: 'Total Users', value: stats?.userCount ?? '...', icon: Users, color: 'purple', trend: 'Across all tenants' },
        { label: 'Total Courses', value: stats?.courseCount ?? '...', icon: BookOpen, color: 'emerald', trend: 'Platform-wide' },
        { label: 'Total Enrollments', value: stats?.enrollmentCount ?? '...', icon: TrendingUp, color: 'orange', trend: 'All time' },
    ];

    const colorMap: Record<string, string> = {
        blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-400',
        purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/20 text-purple-400',
        emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
        orange: 'from-orange-500/20 to-orange-600/5 border-orange-500/20 text-orange-400',
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black tracking-tight uppercase">Platform Overview</h1>
                    <p className="text-muted-foreground text-sm mt-1">Real-time intelligence across all client deployments.</p>
                </div>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <button
                        onClick={() => setShowSpinoff(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
                    >
                        <Zap className="w-4 h-4" /> Quick Spin-off
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.label} className={`p-6 rounded-2xl border bg-gradient-to-br ${colorMap[card.color]}`}>
                            <div className="flex justify-between items-start mb-4">
                                <Icon className={`w-6 h-6 ${colorMap[card.color].split(' ').pop()}`} />
                                <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <p className="text-3xl font-black mb-1">
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : card.value}
                            </p>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{card.label}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">{card.trend}</p>
                        </div>
                    );
                })}
            </div>

            {/* Recent Tenants */}
            <div className="glassmorphism rounded-2xl overflow-hidden border border-border/50">
                <div className="p-6 border-b border-border/50 flex justify-between items-center">
                    <h2 className="font-bold flex items-center gap-2"><Building2 className="w-5 h-5 text-blue-500" /> Recent Deployments</h2>
                    <Link href="/admin/tenants" className="text-xs font-bold text-blue-400 hover:underline">View All →</Link>
                </div>
                <div className="divide-y divide-border/50">
                    {loading ? (
                        <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
                    ) : (stats?.recentTenants?.length ?? 0) === 0 ? (
                        <div className="py-16 text-center text-muted-foreground">
                            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="font-bold">No client workspaces yet.</p>
                            <p className="text-sm">Use Quick Spin-off to deploy your first client.</p>
                        </div>
                    ) : stats?.recentTenants?.map(t => (
                        <div key={t.id} className="px-6 py-4 flex items-center justify-between hover:bg-secondary/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-black text-blue-400 text-sm">
                                    {(t.name || '??').substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-sm">{t.name}</p>
                                    <p className="text-xs text-muted-foreground italic">{t.subdomain}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'lvh.me:3000'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-full border ${t.isActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                    {t.isActive ? 'Online' : 'Offline'}
                                </span>
                                <span className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Spin-off Modal */}
            {showSpinoff && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto p-4 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-background border border-border w-full max-w-2xl max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 overflow-y-auto">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2"><Zap className="w-5 h-5 text-blue-400" /> Deploy New Workspace</h3>
                                <p className="text-sm text-muted-foreground mt-1">Spin up a new client LMS in seconds.</p>
                            </div>
                            <button onClick={() => { setShowSpinoff(false); setSpinResult(null); setSpinError(''); }} className="text-muted-foreground hover:text-foreground text-2xl leading-none">&times;</button>
                        </div>

                        {spinResult ? (
                            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
                                <p className="text-3xl">🚀</p>
                                <p className="font-black text-emerald-400 text-lg">Workspace Live!</p>
                                <p className="text-sm text-muted-foreground">Your client can access their portal at:</p>
                                <a href={`http://${form.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/login`}
                                    className="block font-mono text-blue-400 hover:underline text-sm"
                                    target="_blank">
                                    http://{form.subdomain}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN}/login
                                </a>
                                <button onClick={() => { setShowSpinoff(false); setSpinResult(null); setSpinError(''); }} className="mt-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg text-sm">Done</button>
                            </div>
                        ) : (
                            <form onSubmit={handleSpinoff} className="space-y-4">
                                {[
                                    { key: 'name' as const, label: 'Organization Name', placeholder: 'Acme Academy' },
                                    { key: 'subdomain' as const, label: 'Subdomain', placeholder: 'acme (→ acme.lms.com)' },
                                    { key: 'adminEmail' as const, label: 'Admin Email', placeholder: 'admin@acme.com', type: 'email' },
                                    { key: 'adminPassword' as const, label: 'Admin Password', placeholder: 'Temporary password', type: 'password' },
                                ].map((field: { key: SpinoffFormKey; label: string; placeholder: string; type?: string }) => (
                                    <div key={field.key} className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{field.label}</label>
                                            {formErrors[field.key] && <span className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-right-1 uppercase tracking-tight">{formErrors[field.key]}</span>}
                                        </div>
                                        <input
                                            type={field.type || 'text'}
                                            placeholder={field.placeholder}
                                            className={`w-full bg-secondary/50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all ${formErrors[field.key] ? 'border-red-500/50 focus:ring-red-500/50' : 'border-border focus:ring-blue-500/50'}`}
                                            value={form[field.key]}
                                            onChange={e => {
                                                const value = field.key === 'subdomain'
                                                    ? e.target.value.trim().toLowerCase()
                                                    : e.target.value;
                                                setForm({ ...form, [field.key]: value });
                                                if (formErrors[field.key]) {
                                                    const newErrors = { ...formErrors };
                                                    delete newErrors[field.key];
                                                    setFormErrors(newErrors);
                                                }
                                            }}
                                        />
                                    </div>
                                ))}
                                {/* Global Marketplace Toggle */}
                                <div
                                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${form.globalMarketplaceEnabled ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-secondary/30 border-border/50'}`}
                                    onClick={() => setForm({ ...form, globalMarketplaceEnabled: !form.globalMarketplaceEnabled })}
                                >
                                    <div className="flex items-center gap-3">
                                        <Globe className={`w-4 h-4 ${form.globalMarketplaceEnabled ? 'text-indigo-400' : 'text-muted-foreground'}`} />
                                        <div>
                                            <p className="text-sm font-bold">Global Marketplace Access</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Let this workspace claim global courses</p>
                                        </div>
                                    </div>
                                    <div className={`w-10 h-6 rounded-full p-1 flex items-center transition-all ${form.globalMarketplaceEnabled ? 'bg-indigo-500' : 'bg-secondary'}`}>
                                        <div className={`w-4 h-4 rounded-full bg-white shadow transition-all ${form.globalMarketplaceEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={spinning}
                                    className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 disabled:opacity-60"
                                >
                                    {spinning ? <><Loader2 className="w-5 h-5 animate-spin" /> Deploying...</> : <><Zap className="w-5 h-5" /> Launch Workspace</>}
                                </button>
                                {spinError && (
                                    <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-500">
                                        {spinError}
                                    </p>
                                )}
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
