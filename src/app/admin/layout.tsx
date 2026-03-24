'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    BarChart3,
    Users,
    Settings,
    LogOut,
    Menu,
    X,
    CreditCard,
    Building2,
    Bell
} from 'lucide-react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // If we are on the login page (global or tenant), don't show the dashboard layout
    if (pathname.endsWith('/login')) {
        return <>{children}</>;
    }

    const navigations = [
        { name: 'Dashboard', href: '/admin', icon: BarChart3 },
        { name: 'Tenants', href: '/admin/tenants', icon: Building2 },
        { name: 'Global Users', href: '/admin/users', icon: Users },
        { name: 'Billing & Plans', href: '/admin/billing', icon: CreditCard },
        { name: 'Platform Settings', href: '/admin/settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-background flex overflow-hidden">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-secondary/30 border-r border-white/5 backdrop-blur-xl transition-transform duration-300 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="h-full flex flex-col">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-black text-white">
                                I
                            </div>
                            <span className="font-black text-lg tracking-tight uppercase">InfiniteLMS</span>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground hover:text-foreground">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 z-10">
                        <p className="px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Super Admin</p>
                        {navigations.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all group ${isActive
                                        ? 'bg-blue-600/10 text-blue-500 border border-blue-500/20 shadow-lg shadow-blue-500/5'
                                        : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground border border-transparent'
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-500' : 'group-hover:text-foreground transition-colors'}`} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="p-4 border-t border-white/5">
                        <button
                            onClick={async () => {
                                await fetch('/api/logout', { method: 'POST' });
                                window.location.href = '/admin/login';
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-all group border border-transparent"
                        >
                            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[grid-white]/[0.02]">
                <header className="px-8 py-5 border-b border-white/5 flex items-center justify-between glassmorphism lg:bg-transparent z-40">
                    <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex-1 lg:ml-0 ml-4 hidden md:block">
                        {/* Optional top search or breadcrumbs */}
                        <div className="text-sm font-bold text-muted-foreground">Admin / <span className="text-foreground">Overview</span></div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="relative p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-blue-500 border-2 border-background" />
                        </button>
                        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-sm">
                                SA
                            </div>
                            <div className="hidden md:block">
                                <p className="text-xs font-bold leading-tight">Super Admin</p>
                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground leading-tight">System Owner</p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
