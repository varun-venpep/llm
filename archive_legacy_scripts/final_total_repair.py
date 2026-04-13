import re

def final_total_repair():
    with open("src/app/[locale]/t/[domain]/admin/page_backup.tsx", "r") as f:
        content = f.read()

    # 1. Stat map closure (L1736)
    content = content.replace("                                            })}}", "                                            ))}")

    # 2. Courses Tab - Correct closure of map and ternary
    #   loading ? ( ... ) : count === 0 ? ( ... ) : ( courses.map(c => <div ... /> ) )
    #   Requires:
    #   )) - map result and map function
    #   )  - branch 3
    #   )  - branch 1
    #   }  - ternary block
    courses_old = """                                         ))
                                         </div>
                                     )}
                                 </div>
                             </div>
                         )}"""
    courses_new = """                                        ))
                                    )
                                )
                            }
                        </div>
                    </div>
                )}"""
    content = content.replace(courses_old, courses_new)

    # 3. Reports Tab (IIFE to conditional)
    content = content.replace("{activeTab === 'reports' && (() => {", "{activeTab === 'reports' && (")
    # closure
    reports_closure_old = """                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })()}"""
    reports_closure_new = """                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}"""
    content = content.replace(reports_closure_old, reports_closure_new)

    # 4. All other depth fixes (Branding +7, etc.)
    # I'll just add them at the end of the file or before specific markers
    content = content.replace(
        "                                    </div>\n                                )}\n\n\n                {/* ── SETTINGS ── */}",
        "                                    </div>\n                                    </div>\n                                    </div>\n                                    </div>\n                                    </div>\n                                    </div>\n                                    </div>\n                                    </div>\n                                )}\n\n\n                {/* ── SETTINGS ── */}"
    )

    with open("src/app/[locale]/t/[domain]/admin/page.tsx", "w") as f:
        f.write(content)

if __name__ == "__main__":
    final_total_repair()
