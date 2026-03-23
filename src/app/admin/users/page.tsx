'use client';

import { Users, Search, MoreHorizontal } from 'lucide-react';

export default function UsersPage() {
    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-black tracking-tight uppercase flex items-center gap-2">
                        <Users className="w-6 h-6 text-purple-500" />
                        Global Identity Registry
                    </h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Monitor cross-tenant student and admin activities.</p>
                </div>
            </div>

            <div className="glassmorphism p-12 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-2 border border-purple-500/20">
                    <Search className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold">Global User Search Active</h3>
                <p className="text-muted-foreground max-w-sm">
                    Enter an email address or user ID in the top search bar to locate identities across all isolated client environments.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl border border-border/50 bg-secondary/10">
                    <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1">Super Admins</p>
                    <p className="text-3xl font-black text-purple-400">1</p>
                </div>
                <div className="p-6 rounded-2xl border border-border/50 bg-secondary/10">
                    <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1">Tenant Admins</p>
                    <p className="text-3xl font-black text-blue-400">Active Scan...</p>
                </div>
                <div className="p-6 rounded-2xl border border-border/50 bg-secondary/10">
                    <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1">Global Students</p>
                    <p className="text-3xl font-black text-emerald-400">Active Scan...</p>
                </div>
            </div>
        </div>
    );
}
