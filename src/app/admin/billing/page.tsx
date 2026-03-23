'use client';

import { CreditCard, Zap, Sparkles } from 'lucide-react';

export default function BillingPage() {
    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-black tracking-tight uppercase flex items-center gap-2">
                        <CreditCard className="w-6 h-6 text-emerald-500" />
                        Billing & Infrastructure Plans
                    </h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Manage platform monetization and Stripe connected accounts.</p>
                </div>
                <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm shadow-lg shadow-emerald-500/20 transition-all">
                    Connect Stripe
                </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Stripe Connected Status */}
                <div className="glassmorphism p-8 rounded-3xl border border-border/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform duration-700">
                        <Zap className="w-32 h-32 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Platform Revenue</h3>
                    <p className="text-sm text-muted-foreground mb-8 max-w-sm">Your platform takes a 5% cut of all enrollments from tenant workspaces.</p>

                    <div className="space-y-4 relative z-10">
                        <div className="p-4 rounded-xl bg-background/50 border border-border flex justify-between items-center">
                            <span className="font-medium">Total Volume (30d)</span>
                            <span className="font-mono font-bold">$0.00</span>
                        </div>
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center">
                            <span className="font-bold text-emerald-400">Platform Cut (5%)</span>
                            <span className="font-mono font-bold text-emerald-400">$0.00</span>
                        </div>
                    </div>
                </div>

                {/* Plan Engine */}
                <div className="glassmorphism p-8 rounded-3xl border border-border/50">
                    <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-400" /> Subscription Tiers
                    </h3>
                    <p className="text-sm text-muted-foreground mb-8">Manage how you charge LMS clients for Spin-offs.</p>

                    <div className="space-y-4">
                        <div className="p-4 rounded-xl border border-border/50 flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-sm">Growth Tier</h4>
                                <p className="text-xs text-muted-foreground">Up to 1,000 students</p>
                            </div>
                            <span className="font-bold">$199/mo</span>
                        </div>
                        <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-sm text-blue-400">Enterprise Tier</h4>
                                <p className="text-xs text-muted-foreground">Unlimited scale & custom domains</p>
                            </div>
                            <span className="font-bold text-blue-400">$499/mo</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
