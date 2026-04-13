import re

def reconstruct_v3():
    with open("src/app/[locale]/t/[domain]/admin/page_backup.tsx", "r") as f:
        content = f.read()

    # 1. Courses (starts at L1659)
    # L2390 ends the map ))
    # Let's fix L2390-2396
    old_courses = """                                         ))
                                         </div>
                                     )}
                                 </div>
                             </div>
                         )}"""
    # 3 (root) + 8 (open) = 11.
    # We need 8 closing divs.
    new_courses = """                                        )))}
                                    </div>
                                </div>
                                </div>
                                </div>
                                </div>
                                </div>
                                </div>
                                </div>
                            </div>
                        )}
                    </div>"""
    content = content.replace(old_courses, new_courses)

    # 2. Reports
    old_reports = """{activeTab === 'reports' && (() => {
                    const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
                    return (
                        <div className="space-y-6 animate-in fade-in duration-500 pb-10">"""
    new_reports = """{activeTab === 'reports' && (
                        <div className="space-y-6 animate-in fade-in duration-500 pb-10">"""
    content = content.replace(old_reports, new_reports)
    
    old_reports_closure = """                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })()}"""
    # 3 (root) + 5 (open) = 8.
    # We need 5 closing divs.
    new_reports_closure = """                                    ))}
                                </div>
                                </div>
                                </div>
                                </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}"""
    content = content.replace(old_reports_closure, new_reports_closure)

    # 3. Branding (+7)
    old_branding = """                                    </div>
                                )}


                {/* ── SETTINGS ── */}"""
    new_branding = """                                    </div>
                                    </div>
                                    </div>
                                    </div>
                                    </div>
                                    </div>
                                    </div>
                                    </div>
                                )}


                {/* ── SETTINGS ── */}"""
    content = content.replace(old_branding, new_branding)

    # 4. Stat Fix
    content = content.replace(
        "                                                    <p className=\"text-2xl font-black\">{stat.value}</p>\n                                                </div>\n                                            })}}",
        "                                                    <p className=\"text-2xl font-black\">{stat.value}</p>\n                                                </div>\n                                            ))}"
    )

    # 5. Root parents (L1502, L1504, L1506)
    # They should be closed at the end of the file.
    # Backup L4425-4428:
    # </div>\n                )} \n            </div> \n        </main> \n    </div> \n </div>
    # Let's check the backup's end.
    
    with open("src/app/[locale]/t/[domain]/admin/page.tsx", "w") as f:
        f.write(content)

if __name__ == "__main__":
    reconstruct_v3()
