'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { BookOpen, Lock, Mail, ChevronRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

export default function TenantLoginPage() {
    const params = useParams();
    const router = useRouter();
    const domain = params.domain as string;
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    const [tenant, setTenant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const fetchBranding = async () => {
            try {
                const res = await fetch(`/api/t/${domain}/branding`);
                if (res.ok) {
                    const data = await res.json();
                    setTenant(data);
                    
                    // Update Title & Favicon
                    if (data.name) document.title = `Login | ${data.name}`;
                    if (data.favicon) {
                        let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
                        if (!link) {
                            link = document.createElement('link');
                            link.rel = 'icon';
                            document.getElementsByTagName('head')[0].appendChild(link);
                        }
                        link.href = data.favicon;
                    }
                } else {
                    setTenant({ name: domain.charAt(0).toUpperCase() + domain.slice(1) });
                }
            } catch (e) {
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
                // Persist userId so client-side progress tracking works
                if (data.user?.id) {
                    localStorage.setItem(`${domain}_userId`, data.user.id);
                }
                if (data.user.role === 'TENANT_ADMIN' || data.user.role === 'SUPER_ADMIN') {
                    router.push(`/t/${domain}/admin`);
                } else {
                    router.push(`/t/${domain}/dashboard`);
                }
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
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
                                src={mounted ? (resolvedTheme === 'dark' ? (tenant.logoDark || tenant.logoLight) : (tenant.logoLight || tenant.logoDark)) : (tenant.logoLight || tenant.logoDark)} 
                                alt={tenant.name} 
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
                        Workspace Authentication
                    </p>
                </div>

                <div className="glassmorphism p-10 rounded-[2.5rem] border border-border/50 shadow-2xl relative">
                    <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                    
                    <form onSubmit={handleLogin} className="space-y-7">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Identity (Email)</label>
                            <div className="relative group">
                                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-secondary/30 border border-border/50 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-medium"
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
                                    className="w-full bg-secondary/30 border border-border/50 rounded-2xl pl-12 pr-12 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-medium"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-1"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-1">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${rememberMe ? 'bg-primary border-primary' : 'bg-transparent border-border/50 group-hover:border-primary/30'}`}>
                                        {rememberMe && <ChevronRight className="w-3 h-3 text-primary-foreground stroke-[3]" />}
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-widest">Stay logged in</span>
                            </label>
                            <button type="button" className="text-[10px] font-black text-primary hover:text-primary/70 uppercase tracking-widest transition-colors">Emergency Access?</button>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 animate-in shake duration-500">
                                <p className="text-red-400 text-[10px] font-black text-center uppercase tracking-widest">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group shadow-2xl shadow-primary/20 relative overflow-hidden"
                            style={{ backgroundColor: tenant?.primaryColor }}
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            Sign Into Workspace 
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                    Trusted by <span className="text-foreground">{tenant?.name}</span> employees worldwide
                </p>
            </div>
        </div>
    );
}
