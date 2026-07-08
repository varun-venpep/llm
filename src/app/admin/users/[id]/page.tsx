'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    ChevronLeft, Mail, User, Shield, Building2, Calendar, 
    BookOpen, Activity, Loader2, BookOpenCheck, BarChart3, Clock, ExternalLink
} from 'lucide-react';

interface GlobalUserDetail {
    id: string;
    email: string;
    name: string | null;
    role: string;
    isActive: boolean;
    createdAt: string;
    tenant: {
        id: string;
        name: string;
        subdomain: string;
    };
    enrollments: {
        id: string;
        courseId: string;
        status: string;
        course: {
            id: string;
            title: string;
            modules: { lessons: { id: string }[] }[];
        };
    }[];
    progress: { lessonId: string; completed: boolean; courseId?: string }[];
    activityLogs: { id: string; action: string; createdAt: string }[];
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);

    const [user, setUser] = useState<GlobalUserDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [rootDomain, setRootDomain] = useState('lvh.me:3000');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const host = window.location.host;
            const parts = host.split(':');
            const port = parts[1] ? `:${parts[1]}` : '';
            setRootDomain(host.includes('localhost') || host.includes('127.0.0.1') || host.includes('lvh.me') ? `lvh.me${port}` : `${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'lvh.me'}${port}`);
        }
    }, []);

    useEffect(() => {
        if (id) fetchUserProfile();
    }, [id]);

    const fetchUserProfile = async () => {
        try {
            const res = await fetch(`/api/admin/users/${id}`);
            if (!res.ok) {
                setError(res.status === 401 || res.status === 403 ? 'Unauthorized' : 'Failed to load user.');
                return;
            }
            const data = await res.json();
            setUser(data);
        } catch {
            setError('An error occurred.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex flex-col items-center justify-center min-h-screen text-white"><Loader2 className="w-12 h-12 animate-spin text-purple-500" /></div>;
    if (error || !user) return <div className="flex flex-col items-center justify-center min-h-screen text-white"><p className="text-red-400">{error || 'User not found'}</p></div>;

    const totalEnrollments = user.enrollments?.length || 0;
    const completedLessons = user.progress?.filter(p => p.completed).length || 0;
    const totalLessons = user.enrollments?.reduce((acc, en) => acc + (en.course?.modules?.reduce((macc, m) => macc + (m.lessons?.length || 0), 0) || 0), 0) || 0;
    const avgProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto text-white">
            <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                <button onClick={() => router.push('/admin/users')} className="flex items-center gap-2 text-xs font-bold text-muted-foreground cursor-pointer"><ChevronLeft className="w-4 h-4" /> Back</button>
                <h1 className="text-2xl font-black uppercase">Audit: <span className="text-purple-400">{user.name || 'Anonymous'}</span></h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Active Enrollments', value: totalEnrollments, color: 'text-purple-400', icon: BookOpen },
                    { label: 'Lessons Completed', value: completedLessons, color: 'text-emerald-400', icon: BookOpenCheck },
                    { label: 'Overall Progress', value: `${avgProgress}%`, color: 'text-blue-400', icon: BarChart3 },
                    { label: 'Logged Actions', value: user.activityLogs?.length || 0, color: 'text-pink-400', icon: Activity }
                ].map((item, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 p-5 rounded-3xl">
                        <item.icon className={`w-6 h-6 ${item.color} mb-3`} />
                        <p className="text-[10px] font-bold uppercase text-muted-foreground/60">{item.label}</p>
                        <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-center space-y-6">
                        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center font-black text-2xl">
                            {user.name ? user.name.substring(0, 2).toUpperCase() : user.email.substring(0,2).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{user.name || 'Anonymous'}</h2>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        <div className="border-t border-white/10 pt-4 text-left space-y-3 text-xs">
                            <p className="flex justify-between"><span>Role:</span><span className="font-bold">{user.role}</span></p>
                            <p className="flex justify-between"><span>Joined:</span><span className="font-bold">{new Date(user.createdAt).toLocaleDateString()}</span></p>
                            <p className="flex justify-between"><span>Status:</span><span className={`font-bold ${user.isActive ? 'text-emerald-400' : 'text-red-400'}`}>{user.isActive ? 'Active' : 'Disabled'}</span></p>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4">
                        <h3 className="text-xs font-black uppercase text-indigo-400 flex items-center gap-2"><Building2 className="w-4 h-4" /> Tenant Context</h3>
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase">Tenant Workspace</p>
                            <p className="font-bold">{user.tenant.name}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase">Workspace Domain</p>
                            <p className="font-mono text-xs text-blue-400">{user.tenant.subdomain}.{rootDomain}</p>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-6">
                        <h3 className="text-xs font-black uppercase text-emerald-400 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Enrollments</h3>
                        <div className="space-y-4">
                            {user.enrollments?.map((en) => {
                                const lessonsCount = en.course?.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
                                const completedCount = user.progress?.filter(p => p.completed).length || 0; // Filter completed lesson progress
                                const pct = lessonsCount > 0 ? Math.round((completedCount / lessonsCount) * 100) : 0;
                                return (
                                    <div key={en.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                                        <div className="flex justify-between">
                                            <h4 className="font-bold text-sm">{en.course?.title}</h4>
                                            <span className="text-xs text-purple-400">{pct}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-black/30 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-6">
                        <h3 className="text-xs font-black uppercase text-pink-400 flex items-center gap-2"><Clock className="w-4 h-4" /> Timeline</h3>
                        <div className="space-y-4">
                            {user.activityLogs?.slice(0, 10).map((log) => (
                                <div key={log.id} className="text-xs border-l-2 border-pink-500/30 pl-4 py-1">
                                    <p className="font-bold">{log.action}</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(log.createdAt).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
