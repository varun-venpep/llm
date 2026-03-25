'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    BookOpen, Search, LogOut, ChevronRight, ChevronLeft,
    BookMarked, LayoutGrid, Megaphone, CheckCircle2,
    PlayCircle, Loader2, Bell, XCircle, FileText, Upload, Info, Award, User, Settings
} from 'lucide-react';
import { ThemeToggle } from "@/components/ThemeToggle";

interface Course {
    id: string;
    title: string;
    description: string;
    thumbnail: string | null;
    modules: Array<{ id: string; lessons: Array<{ id: string }> }>;
    _count: { enrollments: number };
}

interface Announcement {
    id: string;
    title: string;
    body: string;
    createdAt: string;
    imageUrl?: string;
    documentUrl?: string;
}

interface Progress {
    percentage: number;
    completedCount: number;
    totalLessons: number;
}

export default function StudentDashboard() {
    const params = useParams();
    const router = useRouter();
    const domain = params.domain as string;

    const [courses, setCourses] = useState<Course[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [progressMap, setProgressMap] = useState<Record<string, Progress>>({});
    const [loading, setLoading] = useState(true);
    const [tenantName, setTenantName] = useState('');
    // In a real app, userId comes from session/cookie. Using a placeholder we store in session.
    const [userId, setUserId] = useState<string | null>(null);

    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
    const [announcementPage, setAnnouncementPage] = useState(1);
    const [showNotifications, setShowNotifications] = useState(false);
    const [readAnnouncements, setReadAnnouncements] = useState<string[]>([]);

    // Profile State
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [profileForm, setProfileForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [courseFilter, setCourseFilter] = useState<'all' | 'new' | 'inprogress' | 'completed'>('all');

    const notificationsRef = useRef<HTMLDivElement>(null);
    const ANNOUNCEMENTS_PER_PAGE = 5;

    useEffect(() => {
        const storedRead = localStorage.getItem(`${domain}_read_announcements`);
        if (storedRead) setReadAnnouncements(JSON.parse(storedRead));
    }, [domain]);

    const markAsRead = (id: string) => {
        if (readAnnouncements.includes(id)) return;
        const newRead = [...readAnnouncements, id];
        setReadAnnouncements(newRead);
        localStorage.setItem(`${domain}_read_announcements`, JSON.stringify(newRead));
    };

    const markAllAsRead = () => {
        const allIds = announcements.map(a => a.id);
        setReadAnnouncements(allIds);
        localStorage.setItem(`${domain}_read_announcements`, JSON.stringify(allIds));
    };

    const unreadCount = announcements.filter(a => !readAnnouncements.includes(a.id)).length;

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
        setTenantName(domain.charAt(0).toUpperCase() + domain.slice(1));
        // Attempt to read userId from localStorage (set during login)
        const storedUserId = localStorage.getItem(`${domain}_userId`);
        setUserId(storedUserId);
        fetchData(storedUserId);
    }, [domain]);

    const fetchData = async (uid: string | null) => {
        try {
            const [coursesRes, announcementsRes] = await Promise.all([
                fetch(`/api/t/${domain}/courses?view=student`),
                fetch(`/api/t/${domain}/announcements`)
            ]);
            const [coursesData, announcementsData] = await Promise.all([
                coursesRes.json(), announcementsRes.json()
            ]);

            const publishedCourses = (Array.isArray(coursesData) ? coursesData : []).filter((c: Course) => c.modules !== undefined);
            setCourses(publishedCourses);
            setAnnouncements(Array.isArray(announcementsData) ? announcementsData : []);

            // Fetch progress for each course if we have a userId
            if (uid && publishedCourses.length > 0) {
                const progressResults = await Promise.all(
                    publishedCourses.map((c: Course) =>
                        fetch(`/api/t/${domain}/progress?userId=${uid}&courseId=${c.id}`).then(r => r.json()).catch(() => ({ percentage: 0, completedCount: 0, totalLessons: 0 }))
                    )
                );
                const map: Record<string, Progress> = {};
                publishedCourses.forEach((c: Course, i: number) => { map[c.id] = progressResults[i]; });
                setProgressMap(map);
            }

            // Fetch current user details for profile
            if (uid) {
                const profileRes = await fetch(`/api/t/${domain}/student/profile?userId=${uid}`);
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    setUserName(profileData.name || 'Learner');
                    setUserEmail(profileData.email || '');
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const completedCourses = courses.filter(c => (progressMap[c.id]?.percentage || 0) === 100).length;
    const inProgress = courses.filter(c => {
        const pct = progressMap[c.id]?.percentage || 0;
        return pct > 0 && pct < 100;
    }).length;

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
            addToast('New passwords do not match', 'error');
            return;
        }
        setIsUpdatingProfile(true);
        try {
            const res = await fetch(`/api/t/${domain}/student/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    currentPassword: profileForm.currentPassword,
                    newPassword: profileForm.newPassword
                })
            });
            const data = await res.json();
            if (res.ok) {
                addToast('Password updated successfully');
                setShowProfileModal(false);
                setProfileForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                addToast(data.error || 'Failed to update profile', 'error');
            }
        } catch (e) {
            addToast('Error updating profile', 'error');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const addToast = (message: string, type: 'success' | 'error' = 'success') => {
        // Since we don't have a dedicated toast system here, using simple alert for now 
        // to maintain consistency with the existing dashboard code (wait, dashboard doesn't have addToast yet)
        alert(message);
    };

    return (
        <>
            <div className="min-h-screen bg-background text-foreground flex flex-col">
                {/* Top Navigation */}
                <header className="sticky top-0 z-50 glassmorphism px-8 py-4 flex justify-between items-center border-b border-border/50">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <BookMarked className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-black uppercase tracking-widest text-primary">{tenantName}</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Learning Portal</span>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center flex-1 max-w-xl mx-8 relative">
                        <Search className="w-4 h-4 absolute left-4 text-muted-foreground" />
                        <input type="text" placeholder="Search courses..." className="w-full bg-secondary/30 border border-border/50 rounded-full pl-12 pr-6 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                    </div>

                    <div className="flex items-center gap-6">
                        <button onClick={() => router.push(`/t/${domain}/achievements`)} className="flex items-center gap-2 text-muted-foreground hover:text-yellow-400 transition-colors bg-secondary/20 px-4 py-2 rounded-full border border-border/50 hover:bg-secondary/40">
                            <Award size={16} />
                            <span className="text-xs font-black uppercase tracking-widest">Achievements</span>
                        </button>
                        {announcements.length > 0 && (
                            <div className="relative" ref={notificationsRef}>
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className={`p-2 rounded-full transition-all relative ${showNotifications ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-secondary/40'}`}
                                >
                                    <Bell className="w-5 h-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-blue-500 text-white text-[8px] font-black flex items-center justify-center border-2 border-background animate-in zoom-in duration-300">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                                <ThemeToggle />

                                {/* Notifications Popover */}
                                {showNotifications && (
                                    <div className="absolute top-full right-0 mt-4 w-80 bg-popover/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 z-[100]">
                                        <div className="p-4 border-b border-border/50 bg-primary/5 flex justify-between items-center">
                                            <h3 className="font-bold text-sm flex items-center gap-2"><Megaphone size={14} className="text-primary" /> Recent Updates</h3>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                                                className="text-[9px] font-black uppercase text-primary hover:text-primary/80 tracking-widest transition-colors"
                                            >
                                                Mark all read
                                            </button>
                                        </div>
                                        <div className="max-h-[320px] overflow-y-auto">
                                            {announcements.slice(0, 3).map(a => (
                                                <div
                                                    key={a.id}
                                                    onClick={() => {
                                                        setSelectedAnnouncement(a);
                                                        setShowNotifications(false);
                                                        markAsRead(a.id);
                                                    }}
                                                    className={`p-4 hover:bg-border/50 transition-colors cursor-pointer border-b border-border/50 last:border-0 relative ${!readAnnouncements.includes(a.id) ? 'bg-primary/5' : ''}`}
                                                >
                                                    {!readAnnouncements.includes(a.id) && (
                                                        <div className="absolute top-4 left-2 w-1 h-1 rounded-full bg-blue-500" />
                                                    )}
                                                    <p className="font-bold text-xs line-clamp-1">{a.title}</p>
                                                    <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">{a.body}</p>
                                                    <p className="text-[9px] text-primary/60 mt-2 font-bold uppercase tracking-tighter">{new Date(a.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => {
                                                setShowNotifications(false);
                                                document.getElementById('announcements-section')?.scrollIntoView({ behavior: 'smooth' });
                                            }}
                                            className="w-full py-3 bg-secondary/30 hover:bg-secondary/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-all border-t border-border/50"
                                        >
                                            View All Announcements
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowProfileModal(true)}
                                className="w-10 h-10 rounded-full border-2 border-primary/20 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-black text-white text-sm hover:scale-105 transition-transform"
                                title="Profile Settings"
                            >
                                <User size={18} />
                            </button>
                            <button
                                onClick={async () => {
                                    await fetch(`/api/t/${domain}/logout`, { method: 'POST' }).catch(() => {});
                                    router.push(`/t/${domain}/login`);
                                }}
                                className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all"
                                title="Sign Out"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 max-w-7xl mx-auto w-full p-8 space-y-10">
                    {/* Welcome + Stats */}
                    <section className="relative p-10 rounded-3xl overflow-hidden glassmorphism border border-border/50 bg-gradient-to-r from-blue-600/5 to-purple-600/5">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] -mr-32 -mt-32" />
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            <div className="space-y-3">
                                <h1 className="text-3xl font-black tracking-tight">Welcome Back, Learner! 👋</h1>
                                <p className="text-muted-foreground max-w-md">Continue your learning journey. You have {inProgress} course{inProgress !== 1 ? 's' : ''} in progress.</p>
                                {inProgress > 0 && (
                                    <button
                                    onClick={() => { const c = courses.find(c => (progressMap[c.id]?.percentage || 0) > 0 && (progressMap[c.id]?.percentage || 0) < 100); if (c) router.push(`/t/${domain}/course/${c.id}`); }}
                                    className="mt-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity w-fit">
                                    <PlayCircle size={16} /> Continue Learning <ChevronRight size={16} />
                                </button>
                                )}
                            </div>
                            <div className="flex gap-6 shrink-0">
                                {[
                                    { label: 'Enrolled', value: courses.length, color: 'text-blue-400' },
                                    { label: 'Completed', value: completedCourses, color: 'text-emerald-400' },
                                    { label: 'In Progress', value: inProgress, color: 'text-orange-400' },
                                ].map(stat => (
                                    <div key={stat.label} className="text-center">
                                        <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {/* Course Grid */}
                        <section className="lg:col-span-2 space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                                    <LayoutGrid size={20} className="text-primary" /> My Courses
                                </h2>
                                <div className="flex p-1 bg-secondary/20 rounded-xl border border-border/50 w-fit overflow-x-auto">
                                    {[
                                        { id: 'all', label: 'All', count: courses.length },
                                        { id: 'new', label: 'New', count: courses.filter(c => (progressMap[c.id]?.percentage || 0) === 0).length },
                                        { id: 'inprogress', label: 'In Progress', count: courses.filter(c => { const p = (progressMap[c.id]?.percentage || 0); return p > 0 && p < 100; }).length },
                                        { id: 'completed', label: 'Completed', count: courses.filter(c => (progressMap[c.id]?.percentage || 0) === 100).length },
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setCourseFilter(tab.id as any)}
                                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${courseFilter === tab.id ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground hover:bg-border/50'}`}
                                        >
                                            {tab.label}
                                            <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${courseFilter === tab.id ? 'bg-white/20 text-white' : 'bg-secondary text-muted-foreground'}`}>
                                                {tab.count}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {loading ? [1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-64 rounded-2xl bg-secondary/20 animate-pulse border border-border/50" />
                                )) : courses.filter(c => {
                                    const pct = progressMap[c.id]?.percentage || 0;
                                    if (courseFilter === 'new') return pct === 0;
                                    if (courseFilter === 'inprogress') return pct > 0 && pct < 100;
                                    if (courseFilter === 'completed') return pct === 100;
                                    return true;
                                }).length === 0 ? (
                                    <div className="col-span-2 py-20 text-center space-y-4 glassmorphism rounded-3xl border border-dashed border-border bg-secondary/5">
                                        <BookOpen size={40} className="mx-auto text-muted-foreground opacity-30" />
                                        <p className="text-muted-foreground italic font-medium">
                                            {courseFilter === 'all' ? 'No courses assigned yet.' : `No ${courseFilter} courses found.`}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {courseFilter === 'all' ? 'Contact your administrator to get enrolled in a course.' : `Try checking other tabs or continue your learning.`}
                                        </p>
                                    </div>
                                ) : courses.filter(c => {
                                    const pct = progressMap[c.id]?.percentage || 0;
                                    if (courseFilter === 'new') return pct === 0;
                                    if (courseFilter === 'inprogress') return pct > 0 && pct < 100;
                                    if (courseFilter === 'completed') return pct === 100;
                                    return true;
                                }).map(course => {
                                    const progress = progressMap[course.id];
                                    const pct = progress?.percentage || 0;
                                    return (
                                        <div
                                            key={course.id}
                                            onClick={() => router.push(`/t/${domain}/course/${course.id}`)}
                                            className="group relative rounded-2xl overflow-hidden border border-border/50 glassmorphism hover:border-primary/30 transition-all cursor-pointer hover:translate-y-[-4px]"
                                        >
                                            <div className="aspect-video bg-gradient-to-br from-secondary to-background relative overflow-hidden flex items-center justify-center">
                                                {course.thumbnail ? (
                                                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                ) : (
                                                    <BookOpen size={48} className="text-muted-foreground/20 group-hover:scale-110 transition-transform duration-500" />
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                                                    <span className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                                                        {pct === 0 ? 'Start' : pct === 100 ? 'Review' : 'Continue'} <ChevronRight size={14} />
                                                    </span>
                                                </div>
                                                {pct === 100 && (
                                                    <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                                                        <CheckCircle2 size={16} className="text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-5 space-y-3">
                                                <h3 className="font-bold text-base leading-tight group-hover:text-primary transition-colors">{course.title}</h3>
                                                <p className="text-xs text-muted-foreground line-clamp-2">{course.description}</p>
                                                {/* Progress Bar */}
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                                                        <span>{progress?.completedCount || 0}/{progress?.totalLessons || '...'} lessons</span>
                                                        <span className={pct === 100 ? 'text-emerald-400' : 'text-primary'}>{pct}%</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                                                        <div className="h-full transition-all duration-700 rounded-full" style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#10b981' : '#3b82f6' }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Announcements Sidebar */}
                        <section id="announcements-section" className="space-y-6 scroll-mt-24">
                            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                                <Megaphone size={20} className="text-orange-400" /> Announcements
                            </h2>
                            {announcements.length === 0 ? (
                                <div className="glassmorphism p-6 rounded-2xl border border-border/50 text-center">
                                    <Bell className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-30" />
                                    <p className="text-sm text-muted-foreground">No announcements yet.</p>
                                </div>
                            ) : (() => {
                                const totalPages = Math.ceil(announcements.length / ANNOUNCEMENTS_PER_PAGE);
                                const paginatedAnnouncements = announcements.slice((announcementPage - 1) * ANNOUNCEMENTS_PER_PAGE, announcementPage * ANNOUNCEMENTS_PER_PAGE);
                                return (
                                    <div className="space-y-4">
                                        <div className="space-y-4">
                                            {paginatedAnnouncements.map(a => (
                                                <div
                                                    key={a.id}
                                                    onClick={() => { setSelectedAnnouncement(a); markAsRead(a.id); }}
                                                    className={`glassmorphism p-5 rounded-2xl border transition-all cursor-pointer group space-y-2 relative ${!readAnnouncements.includes(a.id) ? 'border-primary/40 bg-primary/5 shadow-lg shadow-primary/5' : 'border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10 hover:border-orange-500/40'}`}
                                                >
                                                    {!readAnnouncements.includes(a.id) && (
                                                        <div className="absolute top-5 right-5 w-2 h-2 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50 animate-pulse" />
                                                    )}
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                                                            <Megaphone size={14} className="text-orange-400 shrink-0" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-bold text-sm group-hover:text-orange-400 transition-colors">{a.title}</p>
                                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{a.body}</p>
                                                            {(a.imageUrl || a.documentUrl) && (
                                                                <div className="flex gap-2 mt-2">
                                                                    {a.imageUrl && <span className="text-[10px] font-bold bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded flex items-center gap-1"><Info size={10} /> Image Attached</span>}
                                                                    {a.documentUrl && <span className="text-[10px] font-bold bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded flex items-center gap-1"><FileText size={10} /> Doc Attached</span>}
                                                                </div>
                                                            )}
                                                            <p className="text-[10px] text-muted-foreground mt-3 font-medium uppercase tracking-widest">{new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {totalPages > 1 && (
                                            <div className="flex justify-center items-center gap-4 mt-6">
                                                <button
                                                    disabled={announcementPage === 1}
                                                    onClick={() => setAnnouncementPage(p => Math.max(1, p - 1))}
                                                    className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 disabled:opacity-50 transition-all border border-border/50"
                                                >
                                                    <ChevronLeft size={16} />
                                                </button>
                                                <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase">
                                                    Page {announcementPage} of {totalPages}
                                                </span>
                                                <button
                                                    disabled={announcementPage === totalPages}
                                                    onClick={() => setAnnouncementPage(p => Math.min(totalPages, p + 1))}
                                                    className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 disabled:opacity-50 transition-all border border-border/50"
                                                >
                                                    <ChevronRight size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </section>
                    </div>
                </main>
            </div>

            {selectedAnnouncement && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-background border border-border/50 w-full max-w-2xl rounded-[2rem] p-8 space-y-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                        <button onClick={() => setSelectedAnnouncement(null)} className="absolute top-6 right-6 p-2 bg-secondary/80 hover:bg-secondary rounded-full transition-all">
                            <XCircle size={24} className="text-muted-foreground" />
                        </button>
                        <div className="flex items-center gap-4 border-b border-border/50 pb-6">
                            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                                <Megaphone size={20} className="text-orange-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black">{selectedAnnouncement.title}</h3>
                                <div className="text-xs text-muted-foreground tracking-widest uppercase font-bold mt-1">
                                    {new Date(selectedAnnouncement.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{selectedAnnouncement.body}</p>

                            {selectedAnnouncement.imageUrl && (
                                <div className="space-y-2 mt-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Attached Image</h4>
                                    <div className="rounded-xl overflow-hidden border border-border/50 bg-secondary/10">
                                        <img src={selectedAnnouncement.imageUrl} alt="Announcement Attachment" className="w-full h-auto max-h-[400px] object-contain" />
                                    </div>
                                </div>
                            )}

                            {selectedAnnouncement.documentUrl && (
                                <div className="space-y-2 mt-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Attached Document</h4>
                                    <a href={selectedAnnouncement.documentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-secondary/20 hover:bg-secondary/40 hover:border-orange-500/30 transition-all group">
                                        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                            <FileText size={20} className="text-orange-400" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-sm group-hover:text-orange-400 transition-colors">Download Attachment</p>
                                            <p className="text-xs text-muted-foreground">Click to view or download file</p>
                                        </div>
                                        <Upload size={16} className="text-muted-foreground group-hover:text-orange-400 transition-colors transform rotate-90" />
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showProfileModal && (
                <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-background border border-border/50 w-full max-w-md rounded-[2rem] p-8 space-y-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500" />

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Settings className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-black">Profile Settings</h3>
                            </div>
                            <button onClick={() => setShowProfileModal(false)} className="p-2 hover:bg-secondary rounded-full transition-all">
                                <XCircle size={20} className="text-muted-foreground" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="p-4 rounded-2xl bg-secondary/20 border border-border/50 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary border border-primary/20">
                                        {userName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-white">{userName}</span>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{userEmail}</span>
                                    </div>
                                </div>
                                <div className="h-px bg-border/50 w-full" />
                                <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                                    [Note: Name and Email are managed by your administrator and cannot be changed.]
                                </p>
                            </div>

                            <div className="pt-2 space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                    <Award size={12} /> Change Password
                                </h4>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Current Password</label>
                                    <input
                                        type="password"
                                        value={profileForm.currentPassword}
                                        onChange={e => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                                        placeholder="••••••••"
                                        className="w-full bg-secondary/30 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-white placeholder:text-muted-foreground/30"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">New Password</label>
                                        <input
                                            type="password"
                                            value={profileForm.newPassword}
                                            onChange={e => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                                            placeholder="••••••••"
                                            className="w-full bg-secondary/30 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-white placeholder:text-muted-foreground/30"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Confirm New</label>
                                        <input
                                            type="password"
                                            value={profileForm.confirmPassword}
                                            onChange={e => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                                            placeholder="••••••••"
                                            className="w-full bg-secondary/30 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-white placeholder:text-muted-foreground/30"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isUpdatingProfile}
                                className="w-full py-4 mt-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-lg hover:shadow-primary/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Profile'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
