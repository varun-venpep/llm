                {activeTab === 'courses' && (
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
                                    </div>
                                )}

                                {/* Module Builder */}
                                <div className="space-y-4">
                                    {selectedCourse.modules?.map((mod: any) => (
                                        <div key={mod.id} className="glassmorphism rounded-2xl border border-border/50 overflow-hidden">
                                            <div className="flex items-center gap-3 p-4 bg-secondary/20 border-b border-border/50">
                                                <GripVertical size={16} className="text-muted-foreground" />
                                                <div className="flex-1 flex flex-col">
                                                    {editingModuleId === mod.id ? (
                                                        <div className="flex flex-col gap-1 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={moduleEditTitle}
                                                                    onChange={(e) => {
                                                                        setModuleEditTitle(e.target.value);
                                                                        if (validationErrors[`module-${mod.id}`]?.title) {
                                                                            setValidationErrors(prev => ({ ...prev, [`module-${mod.id}`]: null }));
                                                                        }
                                                                    }}
                                                                    className={`flex-1 bg-background border rounded-lg px-2 py-1 text-sm font-bold focus:outline-none transition-all ${validationErrors[`module-${mod.id}`]?.title ? 'border-red-500 focus:ring-1 focus:ring-red-500/50' : 'border-primary/30 focus:border-primary'}`}
                                                                    autoFocus
                                                                    onKeyDown={(e) => { if (e.key === 'Enter') updateModuleTitle(mod.id); if (e.key === 'Escape') setEditingModuleId(null); }}
                                                                />
                                                                <button onClick={() => updateModuleTitle(mod.id)} className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors"><CheckCircle2 size={16} /></button>
                                                                <button onClick={() => setEditingModuleId(null)} className="p-1 text-red-400 hover:text-red-300 transition-colors"><XCircle size={16} /></button>
                                                            </div>
                                                            {validationErrors[`module-${mod.id}`]?.title && <span className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-top-1 ml-1">{validationErrors[`module-${mod.id}`].title}</span>}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <p className={`font-bold ${!mod.isActive ? 'text-muted-foreground line-through' : ''}`}>{mod.title}</p>
                                                            {!mod.isActive && <span className="text-[9px] text-red-400 font-bold uppercase tracking-tighter">Deactivated Module</span>}
                                                        </>
                                                    )}
                                                </div>

                                                <div className="ml-auto flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground mr-2 font-mono">{mod.lessons?.length || 0} Lessons</span>
                                                    <button
                                                        onClick={() => setManagingResources({ id: mod.id, type: 'MODULE', name: mod.title, resources: mod.resources || [] })}
                                                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all bg-background border border-border/50 text-muted-foreground hover:text-blue-400 hover:border-blue-400/30 flex items-center gap-1.5"
                                                    >
                                                        <Archive size={12} /> Resources
                                                    </button>
                                                    <button
                                                        onClick={() => { setEditingModuleId(mod.id); setModuleEditTitle(mod.title); }}
                                                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all bg-background border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30 flex items-center gap-1.5"
                                                    >
                                                        <Edit3 size={12} /> Edit
                                                    </button>
                                                    <div
                                                        onClick={(e) => { e.stopPropagation(); toggleModuleStatus(mod); }}
                                                        className="px-3 py-1.5 rounded-lg bg-background border border-border/50 flex items-center gap-2 cursor-pointer hover:bg-secondary/20 transition-all select-none"
                                                    >
                                                        <div className={`w-8 h-4 rounded-full p-0.5 transition-colors relative ${mod.isActive ? 'bg-emerald-500/20' : 'bg-secondary'}`}>
                                                            <div className={`w-3 h-3 rounded-full shadow-sm shadow-black/20 transition-all ${mod.isActive ? 'translate-x-4 bg-emerald-400' : 'bg-muted-foreground'}`} />
                                                        </div>
                                                        <span className={`text-[9px] font-black uppercase tracking-widest ${mod.isActive ? 'text-emerald-400' : 'text-muted-foreground opacity-50'}`}>
                                                            {mod.isActive ? 'Module Active' : 'Deactivated'}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => deleteModule(e, mod.id)}
                                                        className="p-1.5 rounded-lg transition-all bg-background border border-border/50 text-red-500/70 hover:text-red-400 hover:bg-red-500/10"
                                                        title="Delete Module"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="p-4 space-y-2">
                                                {mod.lessons?.map((lesson: any) => (
                                                    <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/50 group">
                                                        <BookOpen size={14} className="text-muted-foreground" />
                                                        <span className={`text-sm font-medium ${!lesson.isActive ? 'text-muted-foreground line-through' : ''}`}>{lesson.title}</span>
                                                        {!lesson.isActive && <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 rounded-full px-2 py-0.5 font-bold uppercase italic">Deactivated</span>}
                                                        {lesson.videoUrl && <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-2 py-0.5 font-bold uppercase">Video</span>}
                                                        {lesson.resources?.length > 0 && <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-2 py-0.5 font-bold uppercase">{lesson.resources.length} Files</span>}
                                                        {lesson.content && <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full px-2 py-0.5 font-bold uppercase">Text</span>}
                                                        {/* Transcript Status Badge */}
                                                        {lesson.type === 'VIDEO' && lesson.transcriptStatus === 'PROCESSING' && (
                                                            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-2 py-0.5 font-bold uppercase animate-pulse">⏳ Generating Transcript...</span>
                                                        )}
                                                        {lesson.type === 'VIDEO' && lesson.transcriptStatus === 'READY' && (
                                                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-2 py-0.5 font-bold uppercase">✅ Transcript Ready</span>
                                                        )}
                                                        {lesson.type === 'VIDEO' && lesson.transcriptStatus === 'FAILED' && (
                                                            <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 rounded-full px-2 py-0.5 font-bold uppercase">❌ Transcript Failed</span>
                                                        )}
                                                        <div className="ml-auto flex items-center gap-2">
                                                            {lesson.type === 'VIDEO' && lesson.transcriptStatus === 'READY' && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setActiveQuizLesson({ moduleId: mod.id, lessonId: lesson.id });
                                                                        const q = lesson.quiz || { title: lesson.title, questions: [] };
                                                                        setQuizForm({
                                                                            title: q.title || lesson.title,
                                                                            description: q.description || '',
                                                                            passingScore: q.passingScore || 70,
                                                                            questions: q.questions || [],
                                                                            retakeAllowed: q.retakeAllowed ?? true,
                                                                            maxAttempts: q.maxAttempts || 0,
                                                                            isRandomized: q.isRandomized ?? false,
                                                                            randomCount: q.randomCount || 0
                                                                        });
                                                                    }}
                                                                    className="p-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg bg-background border border-indigo-500/30 transition-all flex items-center gap-1.5 px-2.5"
                                                                    title="Generate Quiz using Whisper AI"
                                                                >
                                                                    <Mic size={12} />
                                                                    <span className="text-[9px] font-black uppercase tracking-widest">AI Quiz</span>
                                                                </button>
                                                            )}
                                                            <div
                                                                onClick={(e) => { e.stopPropagation(); toggleLessonStatus(mod.id, lesson); }}
                                                                className="px-3 py-1.5 rounded-lg bg-background border border-border/50 flex items-center gap-2 cursor-pointer hover:bg-secondary/20 transition-all select-none"
                                                            >
                                                                <div className={`w-8 h-4 rounded-full p-0.5 transition-colors relative ${lesson.isActive ? 'bg-emerald-500/20' : 'bg-secondary'}`}>
                                                                    <div className={`w-3 h-3 rounded-full shadow-sm shadow-black/20 transition-all ${lesson.isActive ? 'translate-x-4 bg-emerald-400' : 'bg-muted-foreground'}`} />
                                                                </div>
                                                                <span className={`text-[9px] font-black uppercase tracking-widest ${lesson.isActive ? 'text-emerald-400' : 'text-muted-foreground opacity-50'}`}>
                                                                    {lesson.isActive ? 'Active' : 'Hidden'}
                                                                </span>
                                                            </div>
                                                            <button
                                                                onClick={() => startEditingLesson(mod.id, lesson)}
                                                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg bg-background border border-border/50 transition-all"
                                                                title="Edit Lesson"
                                                            >
                                                                <Edit3 size={14} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => deleteLesson(e, mod.id, lesson.id)}
                                                                className="p-1.5 text-red-500/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg bg-background border border-border/50 transition-all"
                                                                title="Delete Lesson"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {/* Add Lesson Form */}
                                                {activeLessonForms[mod.id] ? (
                                                    <div className="mt-2 p-4 rounded-xl bg-secondary/10 border border-primary/20 space-y-3">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <p className="text-xs font-bold text-primary uppercase tracking-widest">{editingLessonIds[mod.id] ? 'Edit Lesson' : 'Add New Lesson'}</p>
                                                            <button onClick={() => { setActiveLessonForms(prev => ({ ...prev, [mod.id]: false })); setEditingLessonIds(prev => ({ ...prev, [mod.id]: null })); setNewLessonForms(prev => ({ ...prev, [mod.id]: { title: '', content: '', videoUrl: '', pdfUrl: '', type: 'TEXT', isActive: true, resources: [] } })); }} className="text-muted-foreground hover:text-foreground" title="Cancel"><XCircle size={14} /></button>
                                                        </div>

                                                        {/* Type Selector */}
                                                        <div className="flex gap-2 p-1 bg-secondary/20 rounded-xl border border-border/50">
                                                            {(['VIDEO', 'PPT', 'QUIZ', 'TEXT'] as const).map((t) => (
                                                                <button
                                                                    key={t}
                                                                    onClick={() => setNewLessonForms(prev => ({ ...prev, [mod.id]: { ...prev[mod.id], type: t } }))}
                                                                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${newLessonForms[mod.id]?.type === t || (!newLessonForms[mod.id]?.type && t === 'TEXT') ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                                                >
                                                                    {t}
                                                                </button>
                                                            ))}
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            <div className="space-y-1">
                                                                <div className="flex justify-between items-center">
                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Lesson Title</label>
                                                                    {validationErrors[`lesson-${mod.id}`]?.title && <span className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-right-1">{validationErrors[`lesson-${mod.id}`].title}</span>}
                                                                </div>
                                                                <input
                                                                    placeholder="e.g. Introduction to React..."
                                                                    className={`w-full bg-secondary/30 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 transition-all font-bold ${validationErrors[`lesson-${mod.id}`]?.title ? 'border-red-500/50 focus:ring-red-500/50' : 'border-border/50 focus:ring-primary/50'}`}
                                                                    value={newLessonForms[mod.id]?.title || ''}
                                                                    onChange={e => {
                                                                        setNewLessonForms(prev => ({ ...prev, [mod.id]: { ...prev[mod.id], title: e.target.value } }));
                                                                        if (validationErrors[`lesson-${mod.id}`]?.title) {
                                                                            setValidationErrors(prev => ({ ...prev, [`lesson-${mod.id}`]: null }));
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Content Language</label>
                                                                <select
                                                                    value={newLessonForms[mod.id]?.language || 'en'}
                                                                    onChange={e => setNewLessonForms(prev => ({ ...prev, [mod.id]: { ...prev[mod.id], language: e.target.value } }))}
                                                                    className="w-full bg-secondary/30 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-bold"
                                                                >
                                                                    {localesConfig.availableLocales.map(code => (
                                                                        <option key={code} value={code}>
                                                                            {code === 'en' ? 'English' : 'Arabic'}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>

                                                        {newLessonForms[mod.id]?.type === 'VIDEO' && (
                                                            <div className="space-y-3 animate-in fade-in duration-300">
                                                                <div className="p-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 flex flex-col items-center gap-3">
                                                                    <Video className="w-8 h-8 text-primary/50" />
                                                                    <div className="text-center">
                                                                        <p className="text-sm font-bold text-foreground">
                                                                            {newLessonForms[mod.id]?.videoUrl ? 'Video Ready' : 'Main Lesson Video'}
                                                                        </p>
                                                                        <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px]">
                                                                            {newLessonForms[mod.id]?.videoUrl
                                                                                ? newLessonForms[mod.id]?.videoUrl?.split('/').pop()
                                                                                : "Only MP4 uploads are supported for player playback."}
                                                                        </p>
                                                                    </div>
                                                                    <label className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                                                        {newLessonForms[mod.id]?.videoUrl ? 'Replace Video' : 'Upload MP4'}
                                                                        <input
                                                                            type="file"
                                                                            className="hidden"
                                                                            accept=".mp4"
                                                                            disabled={!!uploadProgress[mod.id]}
                                                                            onChange={(e) => {
                                                                                const file = e.target.files?.[0];
                                                                                if (file) handleMainContentUpload(mod.id, file, 'VIDEO');
                                                                            }}
                                                                        />
                                                                    </label>
                                                                    {uploadProgress[mod.id] !== undefined && (
                                                                        <div className="w-full max-w-[200px] h-1.5 bg-secondary/50 rounded-full overflow-hidden mt-1">
                                                                            <div
                                                                                className="h-full bg-primary transition-all duration-300 ease-out"
                                                                                style={{ width: `${uploadProgress[mod.id]}%` }}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {newLessonForms[mod.id]?.type === 'PPT' && (
                                                            <div className="space-y-3 animate-in fade-in duration-300">
                                                                <div className="p-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 flex flex-col items-center gap-3">
                                                                    <FileText className="w-8 h-8 text-primary/50" />
                                                                    <div className="text-center">
                                                                        <p className="text-sm font-bold text-foreground">
                                                                            {newLessonForms[mod.id]?.pdfUrl ? 'Content Ready' : 'Main Lesson Content'}
                                                                        </p>
                                                                        <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px]">
                                                                            {newLessonForms[mod.id]?.pdfUrl
                                                                                ? newLessonForms[mod.id]?.pdfUrl?.split('/').pop()
                                                                                : "Upload PDF or PPTX for the player."}
                                                                        </p>
                                                                    </div>
                                                                    <label className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                                                        {newLessonForms[mod.id]?.pdfUrl ? 'Replace File' : 'Upload File'}
                                                                        <input
                                                                            type="file"
                                                                            className="hidden"
                                                                            accept=".pdf,.pptx"
                                                                            disabled={!!uploadProgress[mod.id]}
                                                                            onChange={(e) => {
                                                                                const file = e.target.files?.[0];
                                                                                if (file) handleMainContentUpload(mod.id, file, 'PPT');
                                                                            }}
                                                                        />
                                                                    </label>
                                                                    {uploadProgress[mod.id] !== undefined && (
                                                                        <div className="w-full max-w-[200px] h-1.5 bg-secondary/50 rounded-full overflow-hidden mt-1">
                                                                            <div
                                                                                className="h-full bg-primary transition-all duration-300 ease-out"
                                                                                style={{ width: `${uploadProgress[mod.id]}%` }}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {newLessonForms[mod.id]?.type === 'QUIZ' && editingLessonIds[mod.id] && (
                                                            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex flex-col items-center gap-3 animate-in fade-in duration-300">
                                                                <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center">
                                                                    <Settings size={20} />
                                                                </div>
                                                                <div className="text-center">
                                                                    <p className="text-sm font-bold">Quiz Configuration</p>
                                                                    <p className="text-[10px] text-muted-foreground line-clamp-1">
                                                                        {mod.lessons?.find((l: any) => l.id === editingLessonIds[mod.id])?.quiz
                                                                            ? 'Quiz already exists'
                                                                            : 'Use Whisper AI to generate questions from your lesson transcript.'}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={() => {
                                                                        const lesson = mod.lessons.find((l: any) => l.id === editingLessonIds[mod.id]);
                                                                        if (lesson) {
                                                                            setActiveQuizLesson({ moduleId: mod.id, lessonId: lesson.id });
                                                                            const q = lesson.quiz || { title: lesson.title, questions: [] };
                                                                            setQuizForm({
                                                                                title: q.title || lesson.title,
                                                                                description: q.description || '',
                                                                                passingScore: q.passingScore || 70,
                                                                                questions: q.questions || [],
                                                                                retakeAllowed: q.retakeAllowed ?? true,
                                                                                maxAttempts: q.maxAttempts || 0,
                                                                                isRandomized: q.isRandomized ?? false,
                                                                                randomCount: q.randomCount || 0
                                                                            });
                                                                        }
                                                                    }}
                                                                    className="px-4 py-2 bg-amber-500 text-white font-bold rounded-lg text-xs hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
                                                                >
                                                                    Manage Quiz Questions
                                                                </button>
                                                            </div>
                                                        )}

                                                        {newLessonForms[mod.id]?.type === 'QUIZ' && !editingLessonIds[mod.id] && (
                                                            <div className="p-4 rounded-xl border border-dashed border-indigo-500/30 bg-indigo-500/5 flex flex-col items-center gap-3 animate-in fade-in duration-300">
                                                                <Mic size={24} className="text-indigo-400" />
                                                                <div className="text-center">
                                                                    <p className="text-sm font-bold text-indigo-300">Whisper AI Generation</p>
                                                                    <p className="text-[10px] text-muted-foreground max-w-[200px] mx-auto">Click below to save this quiz and instantly generate questions using Whisper AI from your course content.</p>
                                                                </div>
                                                                <button
                                                                    disabled={isSavingGeneratedQuiz[mod.id]}
                                                                    onClick={async () => {
                                                                        setIsSavingGeneratedQuiz(prev => ({ ...prev, [mod.id]: true }));
                                                                        try {
                                                                            const saved = await addOrUpdateLesson(mod.id, false);
                                                                            if (saved) {
                                                                                setActiveQuizLesson({ moduleId: mod.id, lessonId: saved.id });
                                                                                setQuizForm({ title: saved.title, description: '', passingScore: 70, questions: [], retakeAllowed: true, maxAttempts: 0, isRandomized: false, randomCount: 0 });
                                                                                // Close the Add Lesson form so they can focus on the Quiz Modal
                                                                                setActiveLessonForms(prev => ({ ...prev, [mod.id]: false }));
                                                                            }
                                                                        } finally {
                                                                            setIsSavingGeneratedQuiz(prev => ({ ...prev, [mod.id]: false }));
                                                                        }
                                                                    }}
                                                                    className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg text-xs hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-50"
                                                                >
                                                                    {isSavingGeneratedQuiz[mod.id] ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                                                    {isSavingGeneratedQuiz[mod.id] ? 'Saving...' : 'Save & Generate with Whisper AI'}
                                                                </button>
                                                            </div>
                                                        )}

                                                        {newLessonForms[mod.id]?.type === 'TEXT' && (
                                                            <textarea
                                                                placeholder="Lesson text content / instructions..."
                                                                rows={4}
                                                                className="w-full bg-secondary/30 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none animate-in slide-in-from-top-2 duration-300"
                                                                value={newLessonForms[mod.id]?.content || ''}
                                                                onChange={e => setNewLessonForms(prev => ({ ...prev, [mod.id]: { ...prev[mod.id], content: e.target.value } }))}
                                                            />
                                                        )}

                                                        <div className="flex items-center gap-2 px-1">
                                                            <input
                                                                type="checkbox"
                                                                id={`lesson-active-${mod.id}`}
                                                                checked={newLessonForms[mod.id]?.isActive ?? true}
                                                                onChange={e => setNewLessonForms(prev => ({ ...prev, [mod.id]: { ...prev[mod.id], isActive: e.target.checked } }))}
                                                                className="rounded border-border/50 bg-secondary/30 text-primary focus:ring-primary/20"
                                                            />
                                                            <label htmlFor={`lesson-active-${mod.id}`} className="text-xs font-medium text-muted-foreground cursor-pointer">Lesson is Active</label>
                                                        </div>

                                                        {/* Stacked Resources Preview */}
                                                        {newLessonForms[mod.id]?.resources?.length > 0 && (
                                                            <div className="flex flex-wrap gap-2 mt-2">
                                                                {newLessonForms[mod.id].resources.map((res: any, idx: number) => (
                                                                    <div key={idx} className="flex items-center gap-2 bg-secondary/50 border border-border/50 rounded-lg px-2 py-1 text-xs text-muted-foreground">
                                                                        {res.type === 'VIDEO' ? <Video size={12} className="text-blue-400" /> : <FileText size={12} className="text-purple-400" />}
                                                                        <span className="max-w-[150px] truncate">{res.name}</span>
                                                                        <button onClick={() => {
                                                                            const newRes = [...newLessonForms[mod.id].resources];
                                                                            newRes.splice(idx, 1);
                                                                            setNewLessonForms(prev => ({ ...prev, [mod.id]: { ...prev[mod.id], resources: newRes } }));
                                                                        }} className="text-red-400 hover:text-red-300 ml-1"><XCircle size={10} /></button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        <div className="flex items-center justify-between mt-4">
                                                            <div className="flex flex-col gap-2 w-full">
                                                                <div className="flex items-center justify-between">
                                                                    <label className={`flex items-center gap-2 px-3 py-1.5 bg-secondary hover:bg-secondary/80 border border-border/50 rounded-lg cursor-pointer transition-colors text-xs font-bold text-muted-foreground ${uploadProgress[`res-${mod.id}`] !== undefined ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                                        <Upload size={14} /> Add Downloadable Resource
                                                                        <input
                                                                            type="file"
                                                                            className="hidden"
                                                                            accept=".mp4,.pdf,.docx,.pptx"
                                                                            disabled={uploadProgress[`res-${mod.id}`] !== undefined}
                                                                            onChange={(e) => handleResourceUpload(mod.id, e)}
                                                                        />
                                                                    </label>
                                                                    <div className="flex items-center gap-2">
                                                                        {!editingLessonIds[mod.id] && (
                                                                            <button onClick={() => addOrUpdateLesson(mod.id, false)} className="px-3 py-1.5 bg-secondary/50 hover:bg-secondary font-bold rounded-lg text-xs transition-colors">
                                                                                Save & Add Next
                                                                            </button>
                                                                        )}
                                                                        <button onClick={() => addOrUpdateLesson(mod.id, true)} className="px-4 py-1.5 bg-primary/20 border border-primary/30 text-primary font-bold rounded-lg text-xs hover:bg-primary/30 transition-colors">
                                                                            <Save size={14} className="inline mr-1" /> {editingLessonIds[mod.id] ? 'Save Changes' : 'Save'}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                {uploadProgress[`res-${mod.id}`] !== undefined && (
                                                                    <div className="w-full h-1 bg-secondary/30 rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full bg-emerald-500 transition-all duration-300 ease-out"
                                                                            style={{ width: `${uploadProgress[`res-${mod.id}`]}%` }}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => { setActiveLessonForms(prev => ({ ...prev, [mod.id]: true })); setNewLessonForms(prev => ({ ...prev, [mod.id]: { title: '', content: '', videoUrl: '', pdfUrl: '', type: 'TEXT', isActive: true, resources: [] } })); setEditingLessonIds(prev => ({ ...prev, [mod.id]: null })); }} className="w-full mt-2 px-4 py-3 border border-dashed border-border/50 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                                                        <Plus size={16} /> Add Lesson
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    <div className="space-y-2">
                                        <div className="flex gap-3">
                                            <input
                                                placeholder="New module title..."
                                                className={`flex-1 bg-secondary/50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all ${validationErrors.newModule ? 'border-red-500/50 focus:ring-red-500/50' : 'border-border focus:ring-primary/50'}`}
                                                value={newModuleTitle}
                                                onChange={e => {
                                                    setNewModuleTitle(e.target.value);
                                                    if (validationErrors.newModule) setValidationErrors(prev => ({ ...prev, newModule: null }));
                                                }}
                                                onKeyDown={e => e.key === 'Enter' && addModule(selectedCourse.id)}
                                            />
                                            <button onClick={() => addModule(selectedCourse.id)} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 flex items-center gap-2">
                                                <Plus size={16} /> Add Module
                                            </button>
                                        </div>
                                        {validationErrors.newModule && <p className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-right-1 ml-1">{validationErrors.newModule}</p>}
                                    <div className="glassmorphism p-6 rounded-3xl border border-border/50 space-y-6">
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                <Globe size={12} className="text-primary" /> Visibility & Status
                                            </h4>
                                            
                                            <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/20 border border-border/50">
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] font-black uppercase tracking-tighter">Published</p>
                                                    <p className="text-[9px] text-muted-foreground">Visible to learners</p>
                                                </div>
                                                <button
                                                    onClick={() => updateCourseStatus(selectedCourse.id, !selectedCourse.isPublished)}
                                                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${selectedCourse.isPublished ? 'bg-emerald-500' : 'bg-secondary-foreground/20'}`}
                                                >
                                                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${selectedCourse.isPublished ? 'translate-x-5' : 'translate-x-0'}`} />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/20 border border-border/50">
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] font-black uppercase tracking-tighter">Marketplace</p>
                                                    <p className="text-[9px] text-muted-foreground">List in internal store</p>
                                                </div>
                                                <button
                                                    onClick={() => setCourseForm(prev => ({ ...prev, isMarketplace: !prev.isMarketplace }))}
                                                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${courseForm.isMarketplace ? 'bg-amber-500' : 'bg-secondary-foreground/20'}`}
                                                >
                                                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${courseForm.isMarketplace ? 'translate-x-5' : 'translate-x-0'}`} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-border/30">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                <Settings2 size={12} className="text-blue-400" /> Advanced Control
                                            </h4>
                                            
                                            <button 
                                                onClick={() => {
                                                    setTranslatingContent({ id: selectedCourse.id, type: 'COURSE', title: selectedCourse.title });
                                                    setShowTranslationModal(true);
                                                }}
                                                className="w-full py-4 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/5 group"
                                            >
                                                <Globe size={14} className="group-hover:rotate-12 transition-transform" /> Manage Translations
                                            </button>

                                            <button 
                                                onClick={() => deleteCourse(selectedCourse.id)}
                                                className="w-full py-4 bg-red-500/5 text-red-500 border border-red-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/5"
                                            >
                                                <Trash2 size={14} /> Delete Course
                                            </button>
                                        </div>
                                    </div>

                                    {/* AI Insight Card */}
                                    <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white space-y-4 shadow-xl">
                                        <div className="flex items-center gap-2 opacity-80">
                                            <Activity size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Growth Engine</span>
                                        </div>
                                        <p className="text-sm font-bold leading-relaxed">
                                            Drafting this course in multiple languages could increase your workspace engagement by up to <span className="text-amber-400">45%</span>.
                                        </p>
                                        <div className="pt-2">
                                            <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                                                <div className="h-full bg-amber-400" style={{ width: '65%' }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div> {/* End Flex Row (Div 7) */}
                        ) : (
                            // ── Courses View ──
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex p-1 bg-secondary/20 rounded-xl border border-border/50 w-fit">
                                        {[
                                            { id: 'all', label: 'All Courses', count: courses.length },
                                            { id: 'published', label: 'Published', count: courses.filter(c => c.isPublished).length },
                                            { id: 'draft', label: 'Drafts', count: courses.filter(c => !c.isPublished).length },
                                        ].map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setCourseFilter(tab.id as any)}
                                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${courseFilter === tab.id ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground hover:bg-border/50'}`}
                                            >
                                                {tab.label}
                                                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${courseFilter === tab.id ? 'bg-white/20 text-white' : 'bg-secondary text-muted-foreground'}`}>
                                                    {tab.count}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {loading ? (
                                        <div className="col-span-3 flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
                                    ) : courses.filter(c => {
                                        if (courseFilter === 'published') return c.isPublished;
                                        if (courseFilter === 'draft') return !c.isPublished;
                                        return true;
                                    }).length === 0 ? (
                                        <div className="col-span-3 text-center py-20 border-2 border-dashed border-border/50 rounded-3xl bg-secondary/5">
                                            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                                            <p className="font-bold text-lg">No {courseFilter === 'all' ? '' : courseFilter} courses</p>
                                            <p className="text-muted-foreground text-sm">
                                                {courseFilter === 'all' ? 'Create your first course to get started.' : `You don't have any ${courseFilter} courses yet.`}
                                            </p>
                                        </div>
                                    ) : (
                                        courses.filter(c => {
                                            if (courseFilter === 'published') return c.isPublished;
                                            if (courseFilter === 'draft') return !c.isPublished;
                                            return true;
                                        }).map((course) => (
                                            <div key={course.id} className="group rounded-3xl overflow-hidden border border-border/50 glassmorphism hover:border-primary/30 transition-all">
                                                <div className="aspect-video bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-b border-border/50 flex items-center justify-center relative overflow-hidden">
                                                    {course.thumbnail ? (
                                                        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    ) : (
                                                        <BookOpen className="w-12 h-12 text-blue-400 opacity-40 group-hover:scale-110 transition-transform duration-500" />
                                                    )}
                                                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
                                                        {course.exclusiveRole && (
                                                            <span className="px-2 py-1 text-[10px] font-black uppercase rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 backdrop-blur-md flex items-center gap-1 shadow-2xl">
                                                                <Lock size={10} /> Exclusive: {course.exclusiveRole.name}
                                                            </span>
                                                        )}
                                                        {course.exclusiveTeam && (
                                                            <span className="px-2 py-1 text-[10px] font-black uppercase rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 backdrop-blur-md flex items-center gap-1 shadow-2xl">
                                                                <UsersRound size={10} /> Team: {course.exclusiveTeam.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="absolute top-3 right-3">
                                                        <span className={`px-2 py-1 text-[10px] font-black uppercase rounded-full border ${course.isPublished ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-orange-500/20 border-orange-500/30 text-orange-400'}`}>
                                                            {course.isPublished ? 'Published' : 'Draft'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="p-6">
                                                    <h3 className="font-bold text-lg leading-tight mb-1">{course.title}</h3>
                                                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{course.description || 'No description yet.'}</p>
                                                    <div className="flex justify-between items-center text-xs text-muted-foreground mb-4">
                                                        <span>{course.modules?.length || 0} modules · {course.modules?.reduce((s: number, m: any) => s + (m.lessons?.length || 0), 0) || 0} lessons</span>
                                                        <span>{course._count?.enrollments || 0} enrolled</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => fetchCourseDetails(course.id)} className="flex-1 py-2 bg-primary/10 border border-primary/20 text-primary font-bold rounded-lg text-sm hover:bg-primary/20 transition-colors flex items-center justify-center gap-1">
                                                            <Edit3 size={14} /> Build Content
                                                        </button>
                                                        <button onClick={() => togglePublish(course)} className="p-2 rounded-lg border border-border hover:bg-secondary/50 transition-colors text-muted-foreground">
                                                            {course.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
