import os

with open("src/app/[locale]/t/[domain]/admin/page.tsx.bak", "r") as f:
    text = f.read()

# Fix 1: Courses Tab
# Replace lines 2391 to 2458
# Target string start: "                                    )}\n                                        </div>\n                                    </div>\n                                </div>\n                            </div>\n                        ) : (\n"
# Up to: "                        )}\n                    </div>\n                )}\n"
courses_target = """                                    )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className={selectedCourse ? "flex gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-700" : "space-y-8 animate-in fade-in duration-500 pb-20"}>
                                <div className={selectedCourse ? "flex-1 space-y-8" : "space-y-8"}>
                                    <div className="flex justify-between items-center mb-4">
                                        <h1 className="text-4xl font-black tracking-tighter">Courses</h1>
                                        <button onClick={() => setShowCourseModal(true)} className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                                            <Plus size={16} /> Create Course
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {courses.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                                            <div className="col-span-full py-20 text-center glassmorphism rounded-[2.5rem] border border-dashed border-border/50">
                                                <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                                                <p className="font-bold text-lg">No courses found matching your search</p>
                                            </div>
                                        ) : (
                                            courses.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())).map(course => (
                                                <div 
                                                    key={course.id} 
                                                    onClick={() => setSelectedCourse(course)}
                                                    className={`group relative aspect-video rounded-3xl overflow-hidden shadow-2xl cursor-pointer ring-offset-4 ring-offset-background transition-all hover:ring-2 hover:ring-primary/20 ${selectedCourse?.id === course.id ? 'ring-2 ring-primary shadow-primary/20 scale-[0.98]' : ''}`}
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />
                                                    {course.thumbnail ? (
                                                        <img src={course.thumbnail} alt={course.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                    ) : (
                                                        <div className="absolute inset-0 w-full h-full bg-secondary flex items-center justify-center text-muted-foreground/20">
                                                            <BookOpen size={64} />
                                                        </div>
                                                    )}
                                                    
                                                    <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                                                        <div className="flex flex-wrap gap-2 mb-3">
                                                            {course.exclusiveTeam && (
                                                                <span className="px-2 py-1 text-[10px] font-black uppercase rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 backdrop-blur-md flex items-center gap-1 shadow-2xl">
                                                                    <UsersRound size={10} /> Team: {course.exclusiveTeam.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h3 className="text-white font-black text-xl leading-tight group-hover:text-primary transition-colors">{course.title}</h3>
                                                        <div className="flex items-center gap-4 mt-3 text-[10px] font-bold text-white/50 uppercase tracking-widest">
                                                            <span className="flex items-center gap-1"><BookOpen size={10} /> {course.modules?.length || 0} Modules</span>
                                                            <span className="flex items-center gap-1"><Users2 size={10} /> {course._count?.enrollments || 0} Learners</span>
                                                        </div>
                                                    </div>

                                                    <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={(e) => { e.stopPropagation(); setShowCourseModal(true); }} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-primary hover:border-primary transition-all">
                                                            <Edit3 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {selectedCourse && courseSettingsSidebar(selectedCourse)}
                            </div>
                        )}
                    </div>
                )}"""

courses_replace = """                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}"""

text = text.replace(courses_target, courses_replace)


# Fix 2: Reports Tab string
reports_target = """                            </div>
                        </div>
                    );
                })()}
                </div>
            )}"""

reports_replace = """                            </div>
                        </div>
                    );
                })()}
                </div>
            )}"""

text = text.replace("""                            </div>
                        </div>
                    );
                })()}
                            </div>
                        </div>
                    </div>
                )}""", """                            </div>
                        </div>
                    );
                })()}
                </div>
            )}""") # Will use exact search in case 


# Fix 3: Branding Tab String
branding_target = """                                            Join Learning Path
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}"""

branding_replace = """                                            Join Learning Path
                                        </button>
                                    </div>
                    </div>
                    </div>
                    </div>
                )}"""

text = text.replace(branding_target, branding_replace)

# Fix 4: End of file
end_target = """                         </div>
                    </div>
                </div>
            </div>
            )}
            </main>
        </div>
    );
}"""

end_replace = """                        </div>
                    </div>
                </div>
            )}
            </main>
        </div>
    );
}"""

text = text.replace(end_target, end_replace)

with open("src/app/[locale]/t/[domain]/admin/page.tsx", "w") as f:
    f.write(text)

