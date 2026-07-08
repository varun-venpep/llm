'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { Lock, Mail, ChevronRight, Loader2, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';

export default function AdminLogin() {
    const router = useRouter();
    const { resolvedTheme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const [branding, setBranding] = useState({
        name: 'Lebra.Ai',
        logoPrimary: '/lebra_ai_logo_transparent.png',
        logoLight: '/lebra_ai_logo_footer.png'
    });

    const isWhiteLogo = (logo?: string) => logo === '/lebra_ai_logo_footer.png';
    const isColorLogo = (logo?: string) =>
        logo === '/lebra_ai_logo_transparent.png' ||
        logo === '/libra_ai_logo_exact.png' ||
        logo === '/lebra_ai_logo.png';

    const colorLogo = branding.logoPrimary && !isWhiteLogo(branding.logoPrimary)
        ? branding.logoPrimary
        : '/lebra_ai_logo_transparent.png';
    const whiteLogo =
        branding.logoLight && !isColorLogo(branding.logoLight)
            ? branding.logoLight
            : '/lebra_ai_logo_footer.png';
    const themeLogo = resolvedTheme === 'dark' ? whiteLogo : colorLogo;

    useEffect(() => {
        fetch('/api/branding')
            .then(res => res.json())
            .then(data => setBranding(data))
            .catch(() => { });
    }, []);

    useEffect(() => {
        const checkAuth = async () => {
            const timeoutId = setTimeout(() => setIsChecking(false), 400);
            try {
                await fetch('/api/auth/session');
                setIsChecking(false);
            } catch {
                setIsChecking(false);
            } finally {
                clearTimeout(timeoutId);
            }
        };
        checkAuth();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, rememberMe }),
            });

            if (res.ok) {
                setToast({ message: 'Authentication successful! Redirecting...', type: 'success' });
                setTimeout(() => {
                    router.push('/admin');
                }, 1500);
            } else {
                const data = await res.json();
                setError(data.error || 'Invalid admin credentials');
                setToast({ message: data.error || 'Invalid admin credentials', type: 'error' });
                setLoading(false);
                setTimeout(() => setToast(null), 4000);
            }
        } catch {
            setError('System error. Please contact platform support.');
            setToast({ message: 'System error. Please contact platform support.', type: 'error' });
            setLoading(false);
            setTimeout(() => setToast(null), 4000);
        }
    };

    if (isChecking) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 bg-[grid-white]/[0.02] relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 blur-[120px] rounded-full -z-10 pointer-events-none" />
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-600/10 blur-[100px] rounded-full -z-10 pointer-events-none" />

            <div className="w-full max-w-md space-y-8 relative z-10">
                <div className="text-center space-y-3">
                    <Image
                        src={themeLogo}
                        alt={`${branding.name} Logo`}
                        width={1340}
                        height={382}
                        className="h-16 w-[230px] object-contain mx-auto mb-4"
                    />
                    <h1 className="text-3xl font-black tracking-tight">{branding.name} Platform</h1>
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
                        Super Admin Access Portal
                    </p>
                </div>

                <div className="glassmorphism p-8 rounded-3xl border border-white/10 shadow-2xl bg-background/50 backdrop-blur-xl">
                    <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Admin Email</label>
                                <div className="relative group">
                                    <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-secondary/30 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                        placeholder="admin@lebra.ai"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Master Password</label>
                                <div className="relative group">
                                    <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="w-full bg-secondary/30 border border-white/10 rounded-xl pl-12 pr-12 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between px-1">
                                <label className="flex items-center gap-2 cursor-pointer group text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                    <input type="checkbox" className="hidden" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${rememberMe ? 'bg-blue-600 border-blue-600' : 'bg-secondary/30 border-white/10'}`}>
                                        {rememberMe && <ChevronRight className="w-2.5 h-2.5 text-white" />}
                                    </div>
                                    Stay logged in
                                </label>
                            </div>

                            {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-[10px] font-black text-center uppercase tracking-widest">{error}</div>}

                            <button type="submit" disabled={loading} className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/20 disabled:opacity-50">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Authenticate via SSO <ChevronRight className="w-5 h-5" /></>}
                            </button>
                    </form>
                </div>
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
