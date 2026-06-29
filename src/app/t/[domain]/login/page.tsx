'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { BookOpen, Lock, Mail, ChevronRight, Loader2, Eye, EyeOff, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

type TenantBranding = {
    name?: string;
    logoLight?: string;
    logoDark?: string;
    primaryColor?: string;
};

export default function TenantLoginPage() {
    const params = useParams();
    const router = useRouter();
    const domain = params.domain as string;
    const { resolvedTheme } = useTheme();

    const [tenant, setTenant] = useState<TenantBranding | null>(null);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Forgot Password Flow State
    const [isResetting, setIsResetting] = useState(false);
    const [isLinkSent, setIsLinkSent] = useState(false);
    const [devResetLink, setDevResetLink] = useState('');
    const [learnerRequest, setLearnerRequest] = useState(false);

    useEffect(() => {
        const fetchBranding = async () => {
            try {
                const res = await fetch(`/api/t/${domain}/branding`);
                if (res.ok) {
                    const data = await res.json();
                    setTenant(data);
                    if (data.name) document.title = `Login | ${data.name}`;
                } else {
                    setTenant({ name: domain.charAt(0).toUpperCase() + domain.slice(1) });
                }
            } catch {
                setTenant({ name: domain.charAt(0).toUpperCase() + domain.slice(1) });
            } finally {
                setLoading(false);
            }
        };
        fetchBranding();
    }, [domain]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/t/${domain}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, rememberMe }),
            });

            const data = await res.json();
            if (res.ok) {
                if (data.user?.id) {
                    const isLearner = data.user.role === 'LEARNER';
                    const storageKey = isLearner ? `${domain}_learner_userId` : `${domain}_admin_userId`;
                    localStorage.setItem(storageKey, data.user.id);
                }
                setToast({ message: 'Welcome back! Logging you in...', type: 'success' });
                setTimeout(() => {
                    if (data.user.role === 'TENANT_ADMIN' || data.user.role === 'SUPER_ADMIN') {
                        router.push(`/t/${domain}/admin`);
                    } else {
                        router.push(`/t/${domain}/dashboard`);
                    }
                }, 1500);
            } else {
                setError(data.error || 'Login failed');
                setToast({ message: data.error || 'Login failed', type: 'error' });
                setLoading(false);
                setTimeout(() => setToast(null), 4000);
            }
        } catch {
            setError('Network error');
            setToast({ message: 'Network error', type: 'error' });
            setLoading(false);
            setTimeout(() => setToast(null), 4000);
        }
    };

    const handleRequestLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setDevResetLink('');
        setLearnerRequest(false);

        try {
            const res = await fetch('/api/auth/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'request', email, domain }),
            });

            if (res.ok) {
                const data = await res.json();
                setLearnerRequest(Boolean(data.learnerRequest));
                setDevResetLink(data.devResetLink || '');
                setIsLinkSent(true);
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to send link');
            }
        } catch {
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 bg-[grid-white]/[0.02] relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[100px] rounded-full -z-10" />

            <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center space-y-2">
                    {tenant?.logoLight || tenant?.logoDark ? (
                        <div className="w-auto h-32 flex items-center justify-center mb-6">
                            <img 
                                src={resolvedTheme === 'dark' ? (tenant.logoDark || tenant.logoLight) : (tenant.logoLight || tenant.logoDark)}
                                alt={tenant.name || domain}
                                className="max-w-[360px] max-h-full object-contain drop-shadow-2xl"
                            />
                        </div>
                    ) : (
                        <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/20 rotate-3 transform transition-transform hover:rotate-0" style={{ backgroundColor: tenant?.primaryColor || '#3b82f6' }}>
                            <BookOpen className="w-8 h-8 text-white" />
                        </div>
                    )}
                    <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
                        {tenant?.name}
                    </h1>
                    <p className="text-muted-foreground font-bold uppercase tracking-[0.25em] text-[10px] opacity-70">
                        {isResetting ? 'Password Help' : 'Workspace Authentication'}
                    </p>
                </div>

                <div className="glassmorphism p-10 rounded-[2.5rem] border border-border/50 shadow-2xl relative">
                    {!isResetting ? (
                        <form onSubmit={handleLogin} className="space-y-7">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Identity (Email)</label>
                                <div className="relative group">
                                    <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-secondary/30 border border-border/50 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Access Pin (Password)</label>
                                <div className="relative group">
                                    <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="w-full bg-secondary/30 border border-border/50 rounded-2xl pl-12 pr-12 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary p-1"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between px-1">
                                <label className="flex items-center gap-3 cursor-pointer group text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                    <input type="checkbox" className="hidden" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-primary border-primary' : 'bg-transparent border-border/50'}`}>
                                        {rememberMe && <ChevronRight className="w-3 h-3 text-primary-foreground stroke-[3]" />}
                                    </div>
                                    Stay logged in
                                </label>
                                <button type="button" onClick={() => setIsResetting(true)} className="text-[10px] font-black text-primary hover:text-primary/70 uppercase tracking-widest transition-colors">Need Password Help?</button>
                            </div>

                            {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-[10px] font-black text-center uppercase tracking-widest">{error}</div>}

                            <button type="submit" className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-3 group shadow-2xl shadow-primary/20" style={{ backgroundColor: tenant?.primaryColor }}>
                                Sign Into Workspace <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-7">
                            {!isLinkSent ? (
                                <form onSubmit={handleRequestLink} className="space-y-7">
                                    <p className="text-[11px] text-muted-foreground leading-relaxed text-center font-medium">Tenant admins receive a secure reset link. Learners can request help from their workspace admin.</p>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                                        <div className="relative group">
                                            <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            <input
                                                type="email"
                                                required
                                                className="w-full bg-secondary/30 border border-border/50 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                                placeholder="Enter your email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-[10px] font-black text-center uppercase tracking-widest">{error}</div>}
                                    <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-primary/20 disabled:opacity-50" style={{ backgroundColor: tenant?.primaryColor }}>
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Continue'}
                                    </button>
                                </form>
                            ) : (
                                <div className="text-center space-y-6 py-4 animate-in fade-in zoom-in duration-500">
                                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-black text-lg">{learnerRequest ? 'Request sent' : devResetLink ? 'Reset link ready' : 'Check your inbox'}</h3>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                                            {learnerRequest
                                                ? 'Your request has been sent to your workspace admin. They will assist you with password reset.'
                                                : devResetLink
                                                ? 'SMTP is not configured for this local environment. Use the reset link below.'
                                                : <>A recovery link has been sent to <strong>{email}</strong>. Please click the link in that email to reset your password.</>}
                                        </p>
                                        {devResetLink && !learnerRequest ? (
                                            <a
                                                href={devResetLink}
                                                className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-xs font-black uppercase tracking-widest text-primary-foreground"
                                                style={{ backgroundColor: tenant?.primaryColor }}
                                            >
                                                Open Reset Link
                                            </a>
                                        ) : null}
                                    </div>
                                </div>
                            )}
                            <button type="button" onClick={() => { setIsResetting(false); setIsLinkSent(false); setDevResetLink(''); setLearnerRequest(false); }} className="w-full py-2 text-[10px] font-black text-muted-foreground hover:text-foreground uppercase tracking-widest flex items-center justify-center gap-2">
                                <ArrowLeft className="w-3 h-3" /> Return to Login
                            </button>
                        </div>
                    )}
                </div>

                <p className="text-center text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                    Trusted by <span className="text-foreground">{tenant?.name}</span> employees worldwide
                </p>
            </div>

            {toast && (
                <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-card border border-border/80 px-5 py-4 rounded-2xl shadow-2xl animate-fade-up max-w-sm backdrop-blur-xl transition-all duration-300">
                    <div className={`p-2 rounded-xl ${toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' : 'bg-red-500/10 text-red-500 dark:text-red-400'}`}>
                        {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                            {toast.type === 'success' ? 'Authenticated' : 'Access Denied'}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                            {toast.message}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
