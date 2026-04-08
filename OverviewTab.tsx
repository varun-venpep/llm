export default function OverviewTab() {
  return (
    <>

                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                            {[
                                { label: 'Learners', value: stats.learners, icon: Users, color: 'blue' },
                                { label: 'Courses', value: stats.courses, icon: BookOpen, color: 'purple' },
                                { label: 'Enrollments', value: stats.enrollments, icon: UserCheck, color: 'emerald' },
                                { label: 'Completion', value: `${stats.completionRate}%`, icon: CheckCircle, color: 'emerald' },
                                { label: 'Avg Progress', value: `${stats.avgProgress}%`, icon: BarChart3, color: 'orange' },
                                { label: 'Avg Quiz', value: `${stats.avgQuizScore}%`, icon: Award, color: 'blue' },
                            ].map(card => (
                                <div key={card.label} className="p-4 rounded-2xl glassmorphism border border-border/50 shadow-xl text-center">
                                    <div className="flex justify-center mb-2">
                                        <card.icon size={16} className={`text-${card.color}-400 opacity-60`} />
                                    </div>
                                    <p className="text-2xl font-black mb-0.5">{loading ? '...' : card.value}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{card.label}</p>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="glassmorphism p-8 rounded-3xl border border-border/50">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Megaphone className="w-5 h-5 text-orange-400" /> Latest Announcements</h3>
                                {announcements.length === 0 ? (
                                    <p className="text-muted-foreground italic text-sm">No announcements yet. Publish your first one!</p>
                                ) : announcements.slice(0, 3).map(a => (
                                    <div key={a.id} className="p-4 rounded-xl bg-secondary/20 border border-border/50 mb-3 hover:bg-secondary/30 transition-all">
                                        <p className="font-bold">{a.title}</p>
                                        <p className="text-sm text-muted-foreground line-clamp-1">{a.body}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="glassmorphism p-8 rounded-3xl border border-border/50">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-blue-400" /> Recent Activity</h3>
                                <div className="space-y-4">
                                    {recentActivity.length === 0 ? (
                                        <p className="text-muted-foreground italic text-sm">No recent activity found.</p>
                                    ) : recentActivity.map((activity, idx) => (
                                        <div key={idx} className="flex gap-4 items-start border-l-2 border-primary/20 pl-4 py-1">
                                            <div className="flex-1">
                                                <p className="text-xs font-bold">{activity.user.name}</p>
                                                <p className="text-[11px] text-muted-foreground">{activity.action}</p>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">{new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    
    </>
  );
}
