'use client';

import { useState, useEffect } from 'react';
import { 
    X, 
    BarChart3, 
    Users, 
    CheckCircle2, 
    TrendingUp, 
    Clock, 
    Mail, 
    Search, 
    ArrowRight,
    Loader2
} from 'lucide-react';

interface MemberStat {
    userId: string;
    name: string;
    email: string;
    avgProgress: number;
    completedCourses: number;
    totalCourses: number;
}

interface GroupStats {
    name: string;
    totalMembers: number;
    aggregateAvgProgress: number;
    aggregateCompletionRate: number;
    memberStats: MemberStat[];
}

interface GroupInsightsSlideOverProps {
    isOpen: boolean;
    onClose: () => void;
    groupId: string | null;
    type: 'role' | 'team';
    domain: string;
}

export function GroupInsightsSlideOver({
    isOpen,
    onClose,
    groupId,
    type,
    domain
}: GroupInsightsSlideOverProps) {
    const [stats, setStats] = useState<GroupStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen && groupId) {
            fetchStats();
        }
    }, [isOpen, groupId]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const endpoint = `/api/t/${domain}/admin/stats/${type === 'role' ? 'roles' : 'teams'}/${groupId}`;
            const res = await fetch(endpoint);
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Failed to fetch group stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredMembers = stats?.memberStats.filter(m => 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] overflow-hidden">
            <div className="absolute inset-0 bg-background/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
            
            <div className="fixed inset-y-0 right-0 max-w-2xl w-full flex">
                <div className="h-full w-full glassmorphism border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
                    
                    {/* Header */}
                    <div className="p-8 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                <BarChart3 className="text-primary w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight">
                                    {stats?.name || (type === 'role' ? 'Role Insights' : 'Team Insights')}
                                </h2>
                                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
                                    {type === 'role' ? 'Learning Velocity by Job Role' : 'Organizational Performance Tracking'}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-xl transition-all text-muted-foreground hover:text-white"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
                        {loading ? (
                            <div className="h-64 flex flex-col items-center justify-center gap-4">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                <p className="text-xs text-muted-foreground uppercase tracking-widest font-black">Synthesizing Analytics...</p>
                            </div>
                        ) : stats ? (
                            <>
                                {/* Key Metrics */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Learners</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-black">{stats.totalMembers}</span>
                                            <Users size={14} className="text-primary opacity-50" />
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Avg Progress</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-black text-emerald-400">{stats.aggregateAvgProgress}%</span>
                                            <TrendingUp size={14} className="text-emerald-400 opacity-50" />
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Completion</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-black text-blue-400">{stats.aggregateCompletionRate}%</span>
                                            <CheckCircle2 size={14} className="text-blue-400 opacity-50" />
                                        </div>
                                    </div>
                                </div>

                                {/* Member Breakdown */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-primary">Member Performance</h3>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <input 
                                                type="text"
                                                placeholder="Filter members..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs focus:outline-none focus:border-primary/50 transition-all w-64"
                                            />
                                        </div>
                                    </div>

                                    <div className="glassmorphism rounded-2xl border border-white/5 overflow-hidden">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-white/5 bg-white/5">
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Learner</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Courses</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Progress</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {filteredMembers.map((member) => (
                                                    <tr key={member.userId} className="hover:bg-white/5 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs uppercase border border-primary/20">
                                                                    {member.name.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-bold">{member.name}</p>
                                                                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                        <Mail size={8} /> {member.email}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className="inline-flex flex-col items-center">
                                                                <span className="text-xs font-black">{member.completedCourses}/{member.totalCourses}</span>
                                                                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">Done</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="space-y-1.5">
                                                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter">
                                                                    <span className={member.avgProgress === 100 ? 'text-emerald-400' : 'text-primary'}>
                                                                        {member.avgProgress}%
                                                                    </span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                                    <div 
                                                                        className={`h-full transition-all duration-1000 ${member.avgProgress === 100 ? 'bg-emerald-400' : 'bg-primary'}`}
                                                                        style={{ width: `${member.avgProgress}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {filteredMembers.length === 0 && (
                                                    <tr>
                                                        <td colSpan={3} className="px-6 py-12 text-center">
                                                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest italic">No learners match your search</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center gap-4">
                                <XCircle className="w-8 h-8 text-red-400/50" />
                                <p className="text-xs text-muted-foreground uppercase tracking-widest font-black text-center">
                                    Strategic Analysis Failed.<br/>
                                    <span className="opacity-50 text-[10px]">No members identified in this group.</span>
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="p-8 border-t border-white/5 bg-white/5 flex items-center justify-between">
                        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] max-w-[200px]">
                            * Data aggregated from real-time learner participation across all assigned course paths.
                        </p>
                        <button 
                            onClick={onClose}
                            className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-black uppercase tracking-widest border border-white/10 transition-all flex items-center gap-2 group"
                        >
                            Dismiss Analysis
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function XCircle({ className, size = 24 }: { className?: string; size?: number }) {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
        </svg>
    );
}
