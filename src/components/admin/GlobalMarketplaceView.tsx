'use client';

import { useState, useEffect, useCallback } from 'react';
import { Globe, BookOpen, Layers, Loader2, CheckCircle, CreditCard, AlertCircle, Search, Filter, ChevronDown, ChevronRight, Video, FileText, HelpCircle, X, Sparkles, ShoppingCart, ArrowRight, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';

interface GlobalCourseForTenant {
    id: string;
    title: string;
    description: string | null;
    thumbnail: string | null;
    skillLevel: string;
    isClaimed: boolean;
    modules: { id: string; title: string; lessons: { id: string }[] }[];
    _count: { marketplaceClaims: number };
    courseCreateCount?: number;
}

interface GlobalMarketplaceViewProps {
    domain: string;
}

export default function GlobalMarketplaceView({ domain }: GlobalMarketplaceViewProps) {
    const [courses, setCourses] = useState<GlobalCourseForTenant[]>([]);
    const [credits, setCredits] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [claimingId, setClaimingId] = useState<string | null>(null);
    const [confirmClaim, setConfirmClaim] = useState<GlobalCourseForTenant | null>(null);
    const [claimSuccess, setClaimSuccess] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const fetchMarketplace = useCallback(async () => {
        try {
            const res = await fetch(`/api/t/${domain}/global-marketplace`);
            if (!res.ok) {
                const data = await res.json();
                setError(data.error || 'Failed to load marketplace');
                return;
            }
            const data = await res.json();
            setCourses(data.courses);
            setCredits(data.courseCredits);
        } catch (e) {
            setError('Failed to load marketplace');
        } finally {
            setLoading(false);
        }
    }, [domain]);

    useEffect(() => { fetchMarketplace(); }, [fetchMarketplace]);

    const handleClaim = async (course: GlobalCourseForTenant) => {
        setClaimingId(course.id);
        setConfirmClaim(null);
        try {
            const res = await fetch(`/api/t/${domain}/global-marketplace/claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId: course.id })
            });
            const data = await res.json();
            if (res.ok) {
                setClaimSuccess(`"${course.title}" added to your workspace!`);
                setCredits(prev => Math.max(0, prev - 1));
                setCourses(prev => prev.map(c => c.id === course.id ? { ...c, isClaimed: true } : c));
                setTimeout(() => setClaimSuccess(null), 6000);
            } else {
                Swal.fire({
                    title: 'Failed to Claim',
                    text: data.error || 'Failed to claim course',
                    icon: 'error',
                    background: 'var(--background)',
                    color: 'var(--foreground)',
                    customClass: {
                        popup: 'rounded-[2rem] border border-border bg-background text-foreground shadow-2xl p-8',
                        title: 'text-lg font-black uppercase tracking-tight text-foreground !m-0 !pt-2 font-sans',
                        htmlContainer: 'text-sm text-muted-foreground font-medium !mt-2 !mb-6 font-sans',
                        confirmButton: 'px-6 py-3 bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] rounded-xl transition-all cursor-pointer font-sans'
                    },
                    buttonsStyling: false
                });
            }
        } catch (e) {
            Swal.fire({
                title: 'Error',
                text: 'Something went wrong. Please try again.',
                icon: 'error',
                background: 'var(--background)',
                color: 'var(--foreground)',
                customClass: {
                    popup: 'rounded-[2rem] border border-border bg-background text-foreground shadow-2xl p-8',
                    title: 'text-lg font-black uppercase tracking-tight text-foreground !m-0 !pt-2 font-sans',
                    htmlContainer: 'text-sm text-muted-foreground font-medium !mt-2 !mb-6 font-sans',
                    confirmButton: 'px-6 py-3 bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] rounded-xl transition-all cursor-pointer font-sans'
                },
                buttonsStyling: false
            });
        } finally {
            setClaimingId(null);
        }
    };

    const filtered = courses.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="w-full flex flex-col items-center justify-center py-40 animate-in fade-in duration-700">
                <div className="max-w-md w-full glassmorphism p-10 rounded-2xl border border-primary/20 text-center space-y-8 shadow-2xl shadow-primary/5">
                    <div className="relative mx-auto w-24 h-24">
                        <div className="absolute inset-0 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center text-primary">
                            <RefreshCw className="w-10 h-10 opacity-70" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-xl font-bold uppercase tracking-tight">Syncing Marketplace</h3>
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-[280px] mx-auto uppercase tracking-widest">
                            Establishing high-fidelity connection with premium curriculum repository...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-xl font-black uppercase">Marketplace Unavailable</h3>
                <p className="text-muted-foreground mt-2 max-w-sm">{error}</p>
                <button onClick={() => fetchMarketplace()} className="mt-8 px-8 py-3 bg-secondary rounded-2xl font-bold hover:bg-secondary/70 transition-all">
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="relative min-h-[600px] space-y-6">
            {/* Marketplace Toolbar - Integrated Below Main Header */}
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between p-3.5 mt-2 bg-background border border-border/60 rounded-xl shadow-sm animate-in fade-in duration-700">
                <div className="flex items-center gap-4 w-full lg:w-auto">
                    {/* Compact Toolbar Controls */}
                    <div className={`flex items-center gap-3 px-4 py-1.5 rounded-lg border transition-all duration-500 ${credits > 0 ? 'bg-indigo-500/5 border-indigo-500/20 text-indigo-400' : 'bg-red-500/5 border-red-500/20 text-red-400'}`}>
                        <Sparkles className="w-3.5 h-3.5" />
                        <div className="flex items-baseline gap-2">
                            <span className="text-[8px] font-bold uppercase tracking-widest opacity-70">Credits:</span>
                            <span className="font-bold text-sm leading-none">{credits} COURSE{credits !== 1 ? 'S' : ''}</span>
                        </div>
                    </div>

                    <div className="h-4 w-px bg-border/40 hidden lg:block" />

                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Marketplace Live</span>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row items-center gap-4 w-full lg:w-auto">
                    <div className="relative w-full lg:w-[280px] group">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors" />
                        <input
                            className="w-full bg-secondary/20 border border-border/50 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50 font-medium"
                            placeholder="Find specific premium curriculum..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Success Notifications */}
            {claimSuccess && (
                <div className="fixed top-24 right-8 z-[100] animate-in slide-in-from-right-8 duration-500">
                    <div className="flex items-center gap-4 p-4 bg-background border border-emerald-500/30 rounded-xl shadow-lg">
                        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold text-[10px] uppercase tracking-tight">Access Synchronized</p>
                            <p className="text-[10px] text-muted-foreground font-medium">{claimSuccess}</p>
                        </div>
                        <button onClick={() => setClaimSuccess(null)} className="ml-4 p-1.5 hover:bg-secondary rounded-lg transition-colors">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {filtered.length === 0 ? (
                <div className="py-32 flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-indigo-500/5 rounded-[2rem] flex items-center justify-center mb-8 border border-indigo-500/10 animate-pulse">
                        <Globe className="w-12 h-12 text-indigo-500/20" />
                    </div>
                    <h4 className="text-2xl font-black uppercase tracking-tighter">No Curriculum Found</h4>
                    <p className="text-xs text-muted-foreground mt-3 max-w-sm leading-relaxed mx-auto">Try adjusting your search filters or browse platform categories for new marketplace updates.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filtered.map((course, idx) => (
                        <div 
                            key={course.id} 
                            style={{ animationDelay: `${idx * 100}ms` }}
                            className={`group relative flex flex-col h-full rounded-xl border overflow-hidden transition-all duration-700 animate-in fade-in slide-in-from-bottom-4 fill-mode-both ${course.isClaimed ? 'border-emerald-500/20 bg-emerald-500/[0.02]' : 'border-border/50 bg-background hover:border-primary/30 hover:shadow-md hover:-translate-y-1'}`}
                        >
                            {/* Visual Layer */}
                            <div className="aspect-video bg-secondary/10 relative overflow-hidden">
                                {course.thumbnail ? (
                                    <img src={course.thumbnail} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={course.title} />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/5">
                                        <Globe className="w-8 h-8 text-primary/20" />
                                    </div>
                                )}
                                
                                {/* Status Overlays */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 p-4 flex flex-col justify-end">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 text-white text-[9px] font-bold uppercase tracking-wider bg-black/40 backdrop-blur-md px-2 py-1 rounded border border-white/10">
                                            <Layers className="w-3 h-3" /> {course.modules.length} Modules
                                        </div>
                                        <div className="flex items-center gap-1 text-white text-[9px] font-bold uppercase tracking-wider bg-black/40 backdrop-blur-md px-2 py-1 rounded border border-white/10">
                                            <BookOpen className="w-3 h-3" /> {course.modules.reduce((t, m) => t + m.lessons.length, 0)} Lessons
                                        </div>
                                    </div>
                                </div>

                                {course.isClaimed && (
                                    <div className="absolute top-3 right-3 z-10 px-3 py-1.5 bg-emerald-500 shadow-md rounded-lg text-[9px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                                        <CheckCircle className="w-3 h-3" /> Live
                                    </div>
                                )}
                            </div>

                            {/* Content Layer */}
                            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{course.skillLevel}</span>
                                            {course.courseCreateCount !== undefined && (
                                                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Limit: {course.courseCreateCount}</span>
                                            )}
                                        </div>
                                        <h3 className="text-base font-bold leading-tight group-hover:text-primary transition-colors uppercase tracking-tight">{course.title}</h3>
                                        {course.description && <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-medium">{course.description}</p>}
                                    </div>

                                    {/* Preview Syllabus Accordion */}
                                    <div className="pt-1">
                                        <button
                                            onClick={() => setExpandedId(expandedId === course.id ? null : course.id)}
                                            className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all px-3 py-1.5 rounded-lg border ${expandedId === course.id ? 'text-primary bg-primary/10 border-primary/20' : 'text-muted-foreground hover:text-foreground bg-secondary/30 border-border/50'}`}
                                        >
                                            {expandedId === course.id ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                            {expandedId === course.id ? 'Hide Syllabus' : 'View Syllabus'}
                                        </button>

                                        {expandedId === course.id && (
                                            <div className="grid gap-1.5 pt-3 animate-in slide-in-from-top-2 duration-300">
                                                {course.modules.map((mod, midx) => (
                                                    <div 
                                                        key={mod.id} 
                                                        className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 border border-border/40 hover:bg-secondary/40 transition-all"
                                                    >
                                                        <div className="w-5 h-5 rounded bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0 border border-primary/20">{midx + 1}</div>
                                                        <div className="flex-1 overflow-hidden">
                                                            <p className="text-xs font-bold truncate">{mod.title}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Claim Interaction */}
                                <div className="pt-2">
                                    {course.isClaimed ? (
                                        <div className="w-full py-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                                            <CheckCircle className="w-3.5 h-3.5" /> Claimed & Available
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setConfirmClaim(course)}
                                            disabled={credits <= 0 || claimingId === course.id}
                                            className="w-full py-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-primary/20"
                                        >
                                            {claimingId === course.id ? (
                                                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Syncing...</>
                                            ) : (
                                                <><ShoppingCart className="w-3.5 h-3.5" /> Claim Curriculum</>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Standard Confirmation Modal */}
            {confirmClaim && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-background border border-border/50 w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-6 relative overflow-hidden">
                        <div className="space-y-4 text-center">
                            <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4 text-primary">
                                <Globe className="w-8 h-8" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold uppercase tracking-tight">Claim Curriculum?</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed px-4">
                                    Porting <span className="text-foreground font-bold italic">"{confirmClaim.title}"</span> into your workspace. 1 credit will be deducted.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => handleClaim(confirmClaim)}
                                className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[10px] uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 group/confirm active:scale-[0.98]"
                            >
                                Confirm Transaction <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={() => setConfirmClaim(null)}
                                className="w-full py-3 bg-secondary/50 font-bold text-[10px] uppercase tracking-widest rounded-lg hover:bg-secondary transition-all border border-border/50 text-muted-foreground"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
