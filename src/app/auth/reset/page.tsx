'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, ChevronRight, Loader2, ShieldCheck, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    const returnTo = searchParams.get('returnTo') || '/admin/login';

    const [loading, setLoading] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'reset', 
                    email, 
                    token, 
                    newPassword 
                }),
            });

            if (res.ok) {
                setSuccess(true);
            } else {
                const data = await res.json();
                setError(data.error || 'Reset failed');
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black">Password Reset!</h2>
                    <p className="text-muted-foreground text-sm">Your security credentials have been updated.</p>
                </div>
                <button 
                    onClick={() => router.push(returnTo)}
                    className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold hover:scale-[1.02] transition-all"
                >
                    Return to Login
                </button>
            </div>
        );
    }

    if (!token || !email) {
        return (
            <div className="text-center space-y-4">
                <p className="text-red-400 font-bold">Invalid or expired reset link.</p>
                <button onClick={() => router.push(returnTo)} className="text-sm text-blue-400 hover:underline">Back to login</button>
            </div>
        );
    }

    return (
        <form onSubmit={handleReset} className="space-y-6">
            <div className="space-y-2 text-center mb-8">
                <h2 className="text-2xl font-black">New Password</h2>
                <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">Resetting for {email}</p>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">New Password</label>
                <div className="relative group">
                    <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-400 transition-colors" />
                    <input
                        type={showPassword ? "text" : "password"}
                        required
                        className="w-full bg-secondary/30 border border-white/10 rounded-xl pl-12 pr-12 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        placeholder="Min. 8 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
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

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Confirm Password</label>
                <div className="relative group">
                    <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-400 transition-colors" />
                    <input
                        type="password"
                        required
                        className="w-full bg-secondary/30 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        placeholder="Repeat password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-[10px] font-black text-center uppercase tracking-widest">{error}</div>}

            <button type="submit" disabled={loading} className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/20 disabled:opacity-50">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Update Password <ChevronRight className="w-5 h-5" /></>}
            </button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 bg-[grid-white]/[0.02] relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 blur-[120px] rounded-full -z-10 pointer-events-none" />
            
            <div className="w-full max-w-md space-y-8 relative z-10">
                <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck className="w-6 h-6 text-primary" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight">Security Portal</h1>
                </div>

                <div className="glassmorphism p-8 rounded-3xl border border-white/10 shadow-2xl bg-background/50 backdrop-blur-xl">
                    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
                        <ResetPasswordForm />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
