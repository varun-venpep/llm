'use client';

import { ThemeToggle } from "@/components/ThemeToggle";
import { useState, useEffect } from 'react';
import { Building2, Users, BookOpen, TrendingUp, ArrowUpRight, Plus, Loader2, Zap } from 'lucide-react';
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

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showSpinoff, setShowSpinoff] = useState(false);
    const [form, setForm] = useState({ name: '', subdomain: '', adminEmail: '', adminPassword: '' });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [spinning, setSpinning] = useState(false);
    const [spinResult, setSpinResult] = useState<any>(null);

    useEffect(() => { fetchStats(); }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/admin/stats');
            const data = await res.json();
            setStats(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

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
        setSpinning(true);
        setSpinResult(null);
        try {
            const res = await fetch('/api/admin/tenants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            setSpinResult(data);
            if (res.ok) {
                fetchStats();
            }
        } catch (e) {
            console.error(e);
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
                    ) : stats?.recentTenants.length === 0 ? (
                        <div className="py-16 text-center text-muted-foreground">
                            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="font-bold">No client workspaces yet.</p>
                            <p className="text-sm">Use Quick Spin-off to deploy your first client.</p>
                        </div>
                    ) : stats?.recentTenants.map(t => (
                        <div key={t.id} className="px-6 py-4 flex items-center justify-between hover:bg-secondary/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-black text-blue-400 text-sm">
                                    {t.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-sm">{t.name}</p>
                                    <p className="text-xs text-muted-foreground italic">/t/{t.subdomain}</p>
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
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-background border border-border w-full max-w-lg rounded-3xl shadow-2xl p-8 space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2"><Zap className="w-5 h-5 text-blue-400" /> Deploy New Workspace</h3>
                                <p className="text-sm text-muted-foreground mt-1">Spin up a new client LMS in seconds.</p>
                            </div>
                            <button onClick={() => { setShowSpinoff(false); setSpinResult(null); }} className="text-muted-foreground hover:text-foreground text-2xl leading-none">&times;</button>
                        </div>

                        {spinResult ? (
                            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
                                <p className="text-3xl">🚀</p>
                                <p className="font-black text-emerald-400 text-lg">Workspace Live!</p>
                                <p className="text-sm text-muted-foreground">Your client can access their portal at:</p>
                                <a href={`${window.location.origin}/t/${form.subdomain}/login`}
                                    className="block font-mono text-blue-400 hover:underline text-sm"
                                    target="_blank">
                                    {window.location.origin}/t/{form.subdomain}/login
                                </a>
                                <button onClick={() => { setShowSpinoff(false); setSpinResult(null); }} className="mt-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg text-sm">Done</button>
                            </div>
                        ) : (
                            <form onSubmit={handleSpinoff} className="space-y-4">
                                {[
                                    { key: 'name', label: 'Organization Name', placeholder: 'Acme Academy' },
                                    { key: 'subdomain', label: 'Subdomain', placeholder: 'acme (→ acme.lms.com)' },
                                    { key: 'adminEmail', label: 'Admin Email', placeholder: 'admin@acme.com', type: 'email' },
                                    { key: 'adminPassword', label: 'Admin Password', placeholder: 'Temporary password', type: 'password' },
                                ].map(field => (
                                    <div key={field.key} className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{field.label}</label>
                                            {formErrors[field.key] && <span className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-right-1 uppercase tracking-tight">{formErrors[field.key]}</span>}
                                        </div>
                                        <input
                                            type={field.type || 'text'}
                                            placeholder={field.placeholder}
                                            className={`w-full bg-secondary/50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all ${formErrors[field.key] ? 'border-red-500/50 focus:ring-red-500/50' : 'border-border focus:ring-blue-500/50'}`}
                                            value={(form as any)[field.key]}
                                            onChange={e => {
                                                setForm({ ...form, [field.key]: e.target.value });
                                                if (formErrors[field.key]) {
                                                    const newErrors = { ...formErrors };
                                                    delete newErrors[field.key];
                                                    setFormErrors(newErrors);
                                                }
                                            }}
                                        />
                                    </div>
                                ))}
                                <button
                                    type="submit"
                                    disabled={spinning}
                                    className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 disabled:opacity-60"
                                >
                                    {spinning ? <><Loader2 className="w-5 h-5 animate-spin" /> Deploying...</> : <><Zap className="w-5 h-5" /> Launch Workspace</>}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
