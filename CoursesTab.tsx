export default function CoursesTab() {
  return (
    <>
<div className="animate-in fade-in duration-500">
                        {selectedCourse ? (
                            // Course Builder View
                            <div className="space-y-6">
                                <button onClick={() => setSelectedCourse(null)} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
                                    ← Back to Courses
                                </button>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-black">{selectedCourse.title}</h3>
                                        <p className="text-sm text-muted-foreground">{selectedCourse.description}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button onClick={() => {
                                            setCourseForm({
                                                title: selectedCourse.title,
                                                description: selectedCourse.description || '',
                                                thumbnail: selectedCourse.thumbnail || '',
                                                skillLevel: selectedCourse.skillLevel || 'All Levels',
                                                languages: selectedCourse.languages || 'English',
                                                captions: selectedCourse.captions || false,
                                                isMarketplace: selectedCourse.isMarketplace || false,
                                                exclusiveRoleId: selectedCourse.exclusiveRoleId || '',
                                                exclusiveTeamId: selectedCourse.exclusiveTeamId || '',
                                                certificateEnabled: selectedCourse.certificateEnabled || false,
                                                certificateTemplateId: selectedCourse.certificateTemplateId || ''
                                            });
                                            setThumbnailPreview(selectedCourse.thumbnail || null);
                                            setShowCourseModal(true);
                                        }}
                                            className="px-4 py-2 rounded-xl font-bold text-xs bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all flex items-center gap-2">
                                            <Settings size={14} /> Course Settings
                                        </button>
                                        <button onClick={() => {
                                            setTranslatingContent({ id: selectedCourse.id, type: 'COURSE', title: selectedCourse.title });
                                            fetchTranslations(selectedCourse.id, 'COURSE');
                                            setShowTranslationModal(true);
                                        }}
                                            className="px-4 py-2 rounded-xl font-bold text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all flex items-center gap-2">
                                            <Globe size={14} /> Manage Translations
                                        </button>
                                        <button onClick={() => fetchCourseStats(selectedCourse.id)}
                                            className="px-4 py-2 rounded-xl font-bold text-xs bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all flex items-center gap-2">
                                            <BarChart3 size={14} /> Course Statistics
                                        </button>
                                        <button onClick={() => togglePublish(selectedCourse)}
                                            className={`px-4 py-2 rounded-xl font-bold text-xs border transition-all flex items-center gap-2 ${selectedCourse.isPublished ? 'border-orange-500/30 text-orange-400 bg-orange-500/10 hover:bg-orange-500/20' : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'}`}>
                                            {selectedCourse.isPublished ? <><EyeOff size={14} /> Unpublish Course</> : <><Eye size={14} /> Publish Course</>}
                                        </button>
                                        <button onClick={() => setManagingResources({ id: selectedCourse.id, type: 'COURSE', name: selectedCourse.title, resources: selectedCourse.resources || [] })}
                                            className="px-4 py-2 rounded-xl font-bold text-xs bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all flex items-center gap-2">
                                            <Archive size={14} /> Course Resources
                                        </button>
                                        <button onClick={(e) => deleteCourse(e, selectedCourse.id)}
                                            className="px-4 py-2 rounded-xl font-bold text-xs bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all flex items-center gap-2">
                                            <Trash2 size={14} /> Delete Course
                                        </button>
                                    </div>
                                </div>

                                {courseStats && (
                                    <div className="animate-in slide-in-from-top duration-500 space-y-6">
                                        <div className="grid grid-cols-4 gap-4">
                                            {[
                                                { label: 'Enrollments', value: courseStats.totalEnrollments, icon: Users, color: 'blue' },
                                                { label: 'Completions', value: courseStats.totalCompletions, icon: UserCheck, color: 'emerald' },
                                                { label: 'Completion Rate', value: `${courseStats.totalEnrollments > 0 ? Math.round((courseStats.totalCompletions / courseStats.totalEnrollments) * 100) : 0}%`, icon: CheckCircle2, color: 'purple' },
                                                { label: 'Avg. Time', value: `${courseStats.averageCompletionTimeMinutes}m`, icon: Clock, color: 'orange' },
                                            ].map(stat => (
                                                <div key={stat.label} className="p-4 rounded-xl glassmorphism border border-border/50">
                                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                        <stat.icon size={14} />
                                                        <span className="text-[10px] uppercase font-bold tracking-wider">{stat.label}</span>
                                                    </div>
                                                    <p className="text-2xl font-black">{stat.value}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="glassmorphism rounded-2xl border border-border/50 overflow-hidden">
                                            <div className="p-4 bg-secondary/20 border-b border-border/50">
                                                <h4 className="text-sm font-bold flex items-center gap-2"><Users size={14} /> Learner Progress Detail</h4>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-sm">
                                                    <thead>
                                                        <tr className="text-muted-foreground border-b border-border/50">
                                                            <th className="p-4 font-bold">Learner</th>
                                                            <th className="p-4 font-bold">Progress</th>
                                                            <th className="p-4 font-bold">Time Taken</th>
                                                            <th className="p-4 font-bold">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border/50">
                                                        {courseStats.learnerStats.map((s: any) => (
                                                            <tr key={s.userId} className="hover:bg-white/[0.02] transition-colors">
                                                                <td className="p-4">
                                                                    <div className="font-bold">{s.name}</div>
                                                                    <div className="text-[10px] text-muted-foreground">{s.email}</div>
                                                                </td>
                                                                <td className="p-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                                                                            <div className="h-full bg-primary" style={{ width: `${s.percentage}%` }} />
                                                                        </div>
                                                                        <span className="text-[10px] font-bold text-primary">{s.percentage}%</span>
                                                                    </div>
                                                                    <div className="text-[10px] text-muted-foreground mt-1">{s.completedCount}/{s.totalLessons} lessons</div>
                                                                </td>
                                                                <td className="p-4 font-mono text-xs">{s.isCompleted ? `${s.timeTakenMinutes}m` : '-'}</td>
                                                                <td className="p-4">
                                                                    {s.isCompleted ? (
                                                                        <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase">Completed</span>
                                                                    ) : (
                                                                        <span className="px-2 py-1 rounded-full bg-secondary text-muted-foreground text-[10px] font-bold uppercase">In Progress</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    
    </>
  );
}
