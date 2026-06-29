'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
    BarChart3,
    Users,
    Settings,
    LogOut,
    Menu,
    X,
    CreditCard,
    Building2,
    Bell,
    ShieldAlert,
    Award,
    Globe
} from 'lucide-react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [branding, setBranding] = useState({
        name: 'Lebra.Ai',
        logoPrimary: '/lebra_ai_logo_transparent.png',
        logoLight: '/lebra_ai_logo_footer.png'
    });

    const notificationsRef = useRef<HTMLDivElement>(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([
        { id: 1, title: 'Workspace Provisioned', message: 'New workspace "Varun LLM" has been successfully spinoff.', time: '5m ago', read: false },
        { id: 2, title: 'System Security Audit', message: 'Weekly platform credentials integrity scan completed.', time: '1h ago', read: false },
        { id: 3, title: 'Database Backup', message: 'Automated database snapshots saved to AWS S3 storage.', time: '6h ago', read: true },
        { id: 4, title: 'Stripe webhook listener', message: 'Connection established with Stripe Gateway.', time: '1d ago', read: true }
    ]);

    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        fetch('/api/branding')
            .then(res => res.json())
            .then(data => setBranding(data))
            .catch(() => { });
    }, []);

    useEffect(() => {
        setMounted(true);
    }, []);

    // If we are on the login page (global or tenant), don't show the dashboard layout
    if (pathname.endsWith('/login')) {
        return <>{children}</>;
    }

    const navigations = [
        { name: 'Dashboard', href: '/admin', icon: BarChart3 },
        { name: 'Tenants', href: '/admin/tenants', icon: Building2 },
        { name: 'Global Marketplace', href: '/admin/global-marketplace', icon: Globe },
        { name: 'Certificate Library', href: '/admin/certificates', icon: Award },
        { name: 'Admin Master', href: '/admin/staff', icon: ShieldAlert },
        { name: 'Global Users', href: '/admin/users', icon: Users },
        { name: 'Reports & Analytics', href: '/admin/reports', icon: BarChart3 },
        { name: 'Billing & Plans', href: '/admin/billing', icon: CreditCard },
        { name: 'Platform Settings', href: '/admin/settings', icon: Settings },
    ];

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
    const themeLogo = mounted && resolvedTheme === 'dark' ? whiteLogo : colorLogo;

    return (
        <div className="min-h-screen bg-background flex overflow-hidden">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-secondary/30 border-r border-white/5 backdrop-blur-xl transition-transform duration-300 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="h-full flex flex-col">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Image
                                src={themeLogo}
                                alt={`${branding.name} Logo`}
                                width={1340}
                                height={382}
                                className="h-8 w-[116px] object-contain"
                            />
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
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 group w-full text-left"
                        >
                            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-sm">Sign Out</span>
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
                        <div className="relative" ref={notificationsRef}>
                            <button 
                                onClick={() => setShowNotifications(!showNotifications)}
                                className={`relative p-2 rounded-full hover:bg-secondary transition-colors transition-all ${showNotifications ? 'bg-secondary text-foreground animate-none' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-blue-500 border-2 border-background" />
                                )}
                            </button>

                            {showNotifications && (
                                <div className="absolute right-0 mt-3 w-80 bg-background border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="p-4 border-b border-white/5 bg-secondary/20 flex justify-between items-center">
                                        <h3 className="font-bold text-xs uppercase tracking-wider text-foreground">Platform Alerts</h3>
                                        {unreadCount > 0 && (
                                            <button 
                                                onClick={() => {
                                                    setNotifications(notifications.map(n => ({ ...n, read: true })));
                                                }}
                                                className="text-[9px] font-black uppercase text-blue-500 hover:text-blue-400 tracking-widest"
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                    </div>
                                    <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-6 text-center text-xs text-muted-foreground">No alerts found.</div>
                                        ) : (
                                            notifications.map(n => (
                                                <div 
                                                    key={n.id} 
                                                    onClick={() => {
                                                        setNotifications(notifications.map(item => item.id === n.id ? { ...item, read: true } : item));
                                                    }}
                                                    className={`p-4 hover:bg-secondary/30 transition-colors cursor-pointer relative ${!n.read ? 'bg-blue-500/5' : ''}`}
                                                >
                                                    {!n.read && (
                                                        <span className="absolute top-4 left-2 w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                    )}
                                                    <p className="font-bold text-xs text-foreground pl-1">{n.title}</p>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5 pl-1 leading-relaxed">{n.message}</p>
                                                    <span className="text-[9px] text-muted-foreground mt-2 block pl-1">{n.time}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
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
