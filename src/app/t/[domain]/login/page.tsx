'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Lock, Mail, ChevronRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

export default function TenantLoginPage() {
    const params = useParams();
    const router = useRouter();
    const domain = params.domain as string;

    const [tenant, setTenant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // In a real app, fetch tenant branding details here
        setTenant({ name: domain.charAt(0).toUpperCase() + domain.slice(1) });
        setLoading(false);

        // Auto-redirect if already logged in
        const checkAuth = async () => {
            const res = await fetch('/api/auth/session');
            if (res.ok) {
                const data = await res.json();
                if (data.user.role === 'STUDENT') {
                    router.push(`/t/${domain}/dashboard`);
                } else {
                    router.push(`/t/${domain}/admin`);
                }
            }
        };
        checkAuth();
    }, [domain, router]);

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
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 bg-[grid-white]/[0.02] relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[100px] rounded-full -z-10" />

            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-500/20">
                        <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight">{tenant?.name} LMS</h1>
                    <p className="text-muted-foreground font-medium small uppercase tracking-widest text-xs">Sign in to your workspace</p>
                </div>

                <div className="glassmorphism p-8 rounded-3xl border border-border/50 shadow-2xl">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-secondary/50 border border-border rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="w-full bg-secondary/50 border border-border rounded-xl pl-12 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-1">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${rememberMe ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'bg-secondary/50 border-border group-hover:border-primary/50'}`}>
                                    {rememberMe && <ChevronRight className="w-3 h-3 text-primary-foreground stroke-[3]" />}
                                </div>
                                <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-widest">Remember Me</span>
                            </label>
                            <button type="button" className="text-xs font-bold text-primary hover:underline uppercase tracking-widest">Forgot Password?</button>
                        </div>

                        {error && <p className="text-red-400 text-xs font-bold text-center">{error}</p>}

                        <button
                            type="submit"
                            className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-primary/10"
                        >
                            Enter Workspace <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                    Don't have an account? <span className="text-primary font-bold cursor-help hover:underline">Contact your administrator</span>
                </p>
            </div>
        </div>
    );
}
