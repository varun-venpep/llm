'use client';

import { useState, useEffect } from 'react';
import { UsersRound, Building, CheckCircle2, ChevronRight, Loader2, PlayCircle, LibraryBig, Share, ShieldCheck } from 'lucide-react';
 
// ─────────────────────────────────────────────
// MarketplaceCourseCard: Isolated state per card
// ─────────────────────────────────────────────
function MarketplaceCourseCard({ course, teams, domain, onAssigned }: { course: any, teams: any[], domain: string, onAssigned: (tid: string) => void }) {
    const [selectedTeamId, setSelectedTeamId] = useState<string>('');
    const [allTeams, setAllTeams] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
 
    const handleAssign = async () => {
        if (!allTeams && !selectedTeamId) {
            alert('Please select a team to assign this course to.');
            return;
        }
 
        setIsAssigning(true);
        try {
            const res = await fetch(`/api/t/${domain}/manager/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    courseId: course.id, 
                    teamId: allTeams ? undefined : selectedTeamId,
                    allTeams
                })
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message || 'Course assigned successfully!');
                onAssigned(selectedTeamId);
                // Reset card-local selection state
                setSelectedTeamId('');
                setAllTeams(false);
            } else {
                alert(data.error || 'Failed to assign course');
            }
        } catch (e) {
            alert('Error assigning course');
        } finally {
            setIsAssigning(false);
        }
    };
 
    return (
        <div className="glassmorphism rounded-2xl border border-border/50 overflow-hidden flex flex-col group hover:border-amber-500/50 transition-all">
            <div className="aspect-video relative bg-secondary overflow-hidden">
                {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground opacity-20"><PlayCircle size={40} /></div>
                )}
                <div className="absolute top-3 left-3 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                    <LibraryBig size={10} /> Market
                </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-lg leading-tight line-clamp-2">{course.title}</h3>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-3 leading-relaxed flex-1">{course.description}</p>
                
                <div className="mt-5 space-y-3 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2 mb-1">
                        <input 
                            type="checkbox" 
                            id={`all-teams-${course.id}`}
                            checked={allTeams}
                            onChange={(e) => setAllTeams(e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-border/70 accent-amber-500 cursor-pointer"
                        />
                        <label htmlFor={`all-teams-${course.id}`} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground cursor-pointer select-none">Deploy to all my teams</label>
                    </div>
 
                    <select 
                        value={selectedTeamId}
                        onChange={e => setSelectedTeamId(e.target.value)}
                        disabled={allTeams}
                        className="w-full bg-background border border-border/70 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-500/50 appearance-none disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
                    >
                        <option value="">Select target team...</option>
                        {teams.map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.members?.length || 0} Learners)</option>
                        ))}
                    </select>
                    
                    <button 
                        onClick={handleAssign}
                        disabled={isAssigning || (!selectedTeamId && !allTeams)}
                        className="w-full py-2.5 bg-foreground text-background rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isAssigning ? <Loader2 size={14} className="animate-spin" /> : <Share size={14} />}
                        Batch Enroll Team
                    </button>
                </div>
            </div>
        </div>
    );
}

export function ManagerHub({ domain, onBack }: { domain: string, onBack: () => void }) {
    const [activeTab, setActiveTab] = useState<'teams' | 'library'>('teams');
    const [teams, setTeams] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    // Panel states moved to sub-components or handled locally
    const [viewingStatsTeamId, setViewingStatsTeamId] = useState<string | null>(null);
    const [teamStats, setTeamStats] = useState<any>(null);
    const [loadingStats, setLoadingStats] = useState(false);

    useEffect(() => {
        fetchManagerData();
    }, [domain]);

    const fetchManagerData = async () => {
        try {
            const [tRes, cRes] = await Promise.all([
                fetch(`/api/t/${domain}/manager/teams`),
                fetch(`/api/t/${domain}/manager/marketplace`)
            ]);
            
            if (tRes.ok) setTeams(await tRes.json());
            if (cRes.ok) setCourses(await cRes.json());
            
        } catch (e) {
            console.error('Error fetching manager data', e);
        } finally {
            setLoading(false);
        }
    };

    const handleViewStats = async (teamId: string) => {
        setViewingStatsTeamId(teamId);
        setLoadingStats(true);
        try {
            const res = await fetch(`/api/t/${domain}/manager/teams/${teamId}/stats`);
            if (res.ok) {
                setTeamStats(await res.json());
            }
        } catch (e) {
            console.error('Error fetching stats', e);
        } finally {
            setLoadingStats(false);
        }
    };

    // Moved handleAssignCourse into sub-component MarketplaceCourseCard for isolated state scope.


    if (loading) {
        return <div className="py-24 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" /></div>;
    }

    // Only render if they actually manage teams
    if (teams.length === 0) {
        return (
            <div className="py-20 text-center space-y-4">
                <ShieldCheck size={48} className="mx-auto text-muted-foreground opacity-20" />
                <h3 className="text-xl font-black">Manager Authorization Failed</h3>
                <p className="text-muted-foreground">You are not currently assigned as a manager for any active teams.</p>
                <button onClick={onBack} className="px-6 py-2 bg-secondary text-foreground rounded-full text-sm font-bold mt-4 hover:bg-secondary/80">Return to My Learning</button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {viewingStatsTeamId ? (
                <div className="space-y-8 animate-in slide-in-from-bottom-5">
                    <div className="flex items-center justify-between border-b border-border/50 pb-6">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => { setViewingStatsTeamId(null); setTeamStats(null); }}
                                className="p-2 hover:bg-secondary rounded-full transition-colors"
                            >
                                <ChevronRight size={20} className="rotate-180" />
                            </button>
                            <div>
                                <h2 className="text-2xl font-black">{teamStats?.teamName || 'Team Analytics'}</h2>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Real-time Performance & Compliance</p>
                            </div>
                        </div>
                        {loadingStats && <Loader2 className="animate-spin text-primary" size={20} />}
                    </div>

                    {!loadingStats && teamStats && (
                        <div className="grid grid-cols-1 gap-8">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-6 rounded-3xl glassmorphism border border-border/50 flex flex-col items-center justify-center">
                                    <p className="text-4xl font-black text-primary">{teamStats.totalMembers}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2">Team Size</p>
                                </div>
                                <div className="p-6 rounded-3xl glassmorphism border border-border/50 flex flex-col items-center justify-center">
                                    <p className="text-4xl font-black text-amber-500">{teamStats.courseStats?.length || 0}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2">Assigned Courses</p>
                                </div>
                                <div className="p-6 rounded-3xl glassmorphism border border-border/50 flex flex-col items-center justify-center">
                                    <p className="text-4xl font-black text-emerald-500">
                                        {teamStats.courseStats?.length > 0 
                                            ? Math.round(teamStats.courseStats.reduce((s: number, c: any) => s + c.completionRate, 0) / teamStats.courseStats.length)
                                            : 0}%
                                    </p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2">Overall Compliance</p>
                                </div>
                            </div>

                            {/* Detailed List */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-black flex items-center gap-2"><LibraryBig size={18} /> Assigned Curriculum</h3>
                                {teamStats.courseStats.length === 0 ? (
                                    <div className="py-20 text-center glassmorphism rounded-3xl border border-dashed border-border/50">
                                        <p className="text-muted-foreground italic">No courses have been officially assigned to this team curriculum yet.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        {teamStats.courseStats.map((cs: any) => (
                                            <div key={cs.id} className="p-6 rounded-3xl glassmorphism border border-border/50 transition-all hover:border-primary/30">
                                                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                                                    <div className="w-24 h-16 rounded-xl overflow-hidden shrink-0 bg-secondary">
                                                        {cs.thumbnail ? <img src={cs.thumbnail} className="w-full h-full object-cover" /> : <PlayCircle className="w-full h-full p-4 opacity-20" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-lg">{cs.title}</h4>
                                                        <div className="flex items-center gap-4 mt-2">
                                                            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden max-w-xs">
                                                                <div className="h-full bg-primary" style={{ width: `${cs.avgProgress}%` }} />
                                                            </div>
                                                            <span className="text-xs font-black text-primary">{cs.avgProgress}% Avg. Progress</span>
                                                            <span className="text-xs font-bold text-emerald-500 ml-auto">{cs.completionRate}% Completed</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-6 overflow-x-auto">
                                                    <table className="w-full text-left">
                                                        <thead>
                                                            <tr className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/30">
                                                                <th className="pb-3 px-2">Learner</th>
                                                                <th className="pb-3 px-2">Progress</th>
                                                                <th className="pb-3 px-2 text-right">Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-border/20">
                                                            {cs.memberStats.map((ms: any) => (
                                                                <tr key={ms.userId} className="text-xs hover:bg-white/[0.02]">
                                                                    <td className="py-3 px-2">
                                                                        <p className="font-bold">{ms.name}</p>
                                                                        <p className="text-[10px] text-muted-foreground">{ms.email}</p>
                                                                    </td>
                                                                    <td className="py-3 px-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-24 h-1 bg-secondary rounded-full overflow-hidden">
                                                                                <div className="h-full bg-primary" style={{ width: `${ms.progress}%` }} />
                                                                            </div>
                                                                            <span className="font-mono">{ms.progress}%</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-3 px-2 text-right">
                                                                        {ms.isCompleted ? (
                                                                            <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">COMPLETE</span>
                                                                        ) : (
                                                                            <span className="text-[9px] font-black bg-secondary text-muted-foreground px-2 py-0.5 rounded">IN PROGRESS</span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                            <Building className="text-amber-500" /> Executive Manager Hub
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">Oversee team compliance and instantly dispatch corporate training assignments.</p>
                    </div>
                    <div className="flex bg-secondary/30 p-1 rounded-xl border border-border/50">
                        <button 
                            onClick={() => setActiveTab('teams')}
                            className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'teams' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-muted-foreground hover:bg-background'}`}
                        >
                            My Teams
                        </button>
                        <button 
                            onClick={() => setActiveTab('library')}
                            className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'library' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-muted-foreground hover:bg-background'}`}
                        >
                            Internal Library
                        </button>
                    </div>
                </div>

                {/* TAB: TEAMS overview */}
                {activeTab === 'teams' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {teams.map(team => (
                            <div key={team.id} className="p-6 rounded-3xl glassmorphism border border-border/50 shadow-xl overflow-hidden relative group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl -mr-10 -mt-10 group-hover:bg-amber-500/20 transition-all duration-500" />
                                
                                <div className="flex justify-between items-start relative z-10">
                                    <div>
                                        <h3 className="text-xl font-black">{team.name}</h3>
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2 min-h-[40px]">{team.description || 'No description provided.'}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleViewStats(team.id)}
                                        className="p-3 bg-primary/10 text-primary rounded-2xl border border-primary/20 hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/10"
                                        title="View Compliance Insights"
                                    >
                                        <ShieldCheck size={20} />
                                    </button>
                                </div>
                                
                                <div className="mt-6 pt-4 border-t border-border/50 relative z-10">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                            <UsersRound size={12} /> Roster ({team.members?.length || 0})
                                        </h4>
                                        <button onClick={() => handleViewStats(team.id)} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">View Insights</button>
                                    </div>
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                        {team.members?.length === 0 ? (
                                            <p className="text-xs text-muted-foreground italic">No learners assigned.</p>
                                        ) : (
                                            team.members?.map((m: any) => (
                                                <div key={m.id} className="flex flex-col bg-background/50 p-2.5 rounded-xl border border-border/50 hover:bg-background/80 transition-colors">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-bold text-foreground">{m.name || m.email}</span>
                                                        {m.jobRoles && m.jobRoles.length > 0 ? (
                                                            <div className="flex gap-1 flex-wrap justify-end">
                                                                {m.jobRoles.map((r: any) => (
                                                                    <span key={r.name} className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">{r.name}</span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-2 py-0.5">Learner</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* TAB: INTERNAL LIBRARY / ASSIGN COURSE */}
                {activeTab === 'library' && (
                    <div className="space-y-6 animate-in slide-in-from-right-4">
                        {courses.length === 0 ? (
                            <div className="py-20 text-center glassmorphism rounded-3xl border border-dashed border-border/50">
                                <LibraryBig size={48} className="mx-auto mb-4 text-muted-foreground opacity-20" />
                                <h3 className="text-lg font-black">Marketplace Empty</h3>
                                <p className="text-muted-foreground">The Tenant Administrator has not flagged any internal courses for manager distribution.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {courses.map(course => (
                                    <MarketplaceCourseCard 
                                        key={course.id} 
                                        course={course} 
                                        teams={teams} 
                                        domain={domain}
                                        onAssigned={(teamId) => {
                                            if (viewingStatsTeamId === teamId) handleViewStats(teamId);
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
                </>
            )}
        </div>
    );
}
