'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    BookMarked, Search, LogOut, Award, ChevronLeft, ArrowLeft, Download
} from 'lucide-react';

interface Course {
    id: string;
    title: string;
    description: string;
    thumbnail: string | null;
    skillLevel: string;
    languages: string;
    captions: string;
    modules: any[];
}

interface Progress {
    percentage: number;
    completedCount: number;
    totalLessons: number;
}

export default function AchievementsPage() {
    const params = useParams();
    const router = useRouter();
    const domain = params.domain as string;

    const [courses, setCourses] = useState<Course[]>([]);
    const [progressMap, setProgressMap] = useState<Record<string, Progress>>({});
    const [loading, setLoading] = useState(true);
    const [tenantName, setTenantName] = useState('');
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        setTenantName(domain.charAt(0).toUpperCase() + domain.slice(1));
        const storedUserId = localStorage.getItem(`${domain}_userId`);
        setUserId(storedUserId);
        fetchData(storedUserId);
    }, [domain]);

    const fetchData = async (uid: string | null) => {
        try {
            const coursesRes = await fetch(`/api/t/${domain}/courses?view=student`);
            const coursesData = await coursesRes.json();
            const publishedCourses = (Array.isArray(coursesData) ? coursesData : []).filter((c: Course) => c.modules !== undefined);
            
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
            setCourses(publishedCourses);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const completedCourses = courses.filter(c => (progressMap[c.id]?.percentage || 0) === 100);

    if (loading) {
        return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <header className="sticky top-0 z-50 glassmorphism px-8 py-4 flex justify-between items-center border-b border-white/5">
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => router.push(`/t/${domain}/dashboard`)}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <BookMarked className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-black uppercase tracking-widest text-primary">{tenantName}</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Learning Portal</span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <button onClick={() => router.push(`/t/${domain}/dashboard`)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors bg-secondary/20 px-4 py-2 rounded-full border border-white/5 hover:bg-secondary/40">
                        <ArrowLeft size={16} />
                        <span className="text-xs font-black uppercase tracking-widest">Back to Dashboard</span>
                    </button>
                    <div className="w-10 h-10 rounded-full border-2 border-primary/20 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-black text-white text-sm">S</div>
                    <button onClick={() => router.push(`/t/${domain}/login`)} className="text-muted-foreground hover:text-red-400 transition-colors">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full p-8 space-y-10">
                <section className="relative p-10 rounded-3xl overflow-hidden glassmorphism border border-yellow-500/10 bg-gradient-to-r from-yellow-600/5 to-orange-600/5">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 blur-[80px] -mr-32 -mt-32 pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="space-y-3">
                            <h1 className="text-4xl font-black tracking-tight flex items-center gap-4">
                                <Award className="text-yellow-400 w-10 h-10" /> My Achievements
                            </h1>
                            <p className="text-muted-foreground max-w-md">You have completed {completedCourses.length} course{completedCourses.length !== 1 ? 's' : ''} so far. Download your certificates and keep learning!</p>
                        </div>
                    </div>
                </section>

                <section>
                    {completedCourses.length === 0 ? (
                        <div className="p-16 text-center border border-dashed border-white/10 rounded-3xl bg-secondary/5">
                            <Award className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                            <h3 className="text-xl font-bold">No achievements yet</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mt-2">Finish your first course to earn your certificate and unlock achievements.</p>
                            <button onClick={() => router.push(`/t/${domain}/dashboard`)} className="mt-8 px-6 py-3 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs rounded-full hover:scale-105 transition-transform shadow-lg shadow-primary/20">Find a Course</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {completedCourses.map(course => (
                                <div key={course.id} className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-yellow-500/20 bg-secondary/10 hover:border-yellow-500/50 transition-all p-6 min-h-[300px]">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 pointer-events-none z-0" />
                                    <div className="z-10 flex flex-col h-full space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="w-16 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 overflow-hidden">
                                                {course.thumbnail ? (
                                                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Award className="w-6 h-6 text-yellow-400" />
                                                )}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full border border-yellow-500/20">Completed</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-black text-xl leading-tight text-white mb-2">{course.title}</h3>
                                            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{course.description}</p>
                                        </div>
                                        <button 
                                            onClick={() => window.open(`/t/${domain}/certificate/${course.id}`, '_blank')}
                                            className="w-full mt-4 flex items-center justify-center gap-2 py-4 bg-yellow-500 hover:bg-yellow-400 text-yellow-950 rounded-xl font-black uppercase tracking-widest text-[11px] transition-all shadow-lg hover:shadow-yellow-500/20"
                                        >
                                            <Download size={14} /> Download Certificate
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
