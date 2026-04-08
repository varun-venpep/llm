import re

def reconstruct_v2():
    with open("src/app/[locale]/t/[domain]/admin/page_backup.tsx", "r") as f:
        content = f.read()

    # 1. Courses Tab (L1659)
    # Correcting the absolute pileup of closures here.
    # L2343 in backup is: ) : (
    # L2344 in backup is: courses.filter(...).map((course) => (
    # Needs:
    # 1. ) to close map JSX
    # 2. ) to close map function
    # 3. ) to close ternary branch
    # 4. } to close ternary expression
    courses_old = """                                         ))
                                         </div>
                                     )}
                                 </div>
                             </div>
                         )}"""
    courses_new = """                                        )))}
                                    </div>
                                </div>
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
    content = content.replace(courses_old, courses_new)

    # 2. Reports Tab
    content = content.replace("{activeTab === 'reports' && (() => {", "{activeTab === 'reports' && (")
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
                    </div>
                    </div>
                    </div>
                    </div>
                )}"""
    content = content.replace(reports_closure_old, reports_closure_new)

    # 3. Branding (+7)
    content = content.replace(
        "                                    </div>\n                                )}\n\n\n                {/* ── SETTINGS ── */}",
        "                                    </div>\n                                    </div>\n                                    </div>\n                                    </div>\n                                    </div>\n                                    </div>\n                                    </div>\n                                    </div>\n                                )}\n\n\n                {/* ── SETTINGS ── */}"
    )

    # 4-11. All other closures (+1 or +2)
    content = content.replace("                                    </div>\n                                )}\n\n                {activeTab === 'certificates' && (", "                                    </div>\n                                    </div>\n                                )}\n\n                {activeTab === 'certificates' && (")
    content = content.replace("                                    </div>\n                                )}\n            </div>\n        )}\n\n        {showCourseModal && (", "                                    </div>\n                                    </div>\n                                )}\n            </div>\n        )}\n\n        {showCourseModal && (")
    content = content.replace("                                    </div>\n                                )}\n\n            {managingResources && (", "                                    </div>\n                                    </div>\n                                )}\n\n            {managingResources && (")
    content = content.replace("                                    </div>\n                                )}\n\n            {showProfileModal && (", "                                    </div>\n                                    </div>\n                                    </div>\n                                )}\n\n            {showProfileModal && (")
    content = content.replace("                                    </div>\n                                )}\n\n            {confirmModal && (", "                                    </div>\n                                    </div>\n                                    </div>\n                                )}\n\n            {confirmModal && (")
    content = content.replace("                                    </div>\n                                )}\n\n                {showTranslationModal && translatingContent && (", "                                    </div>\n                                    </div>\n                                )}\n\n                {showTranslationModal && translatingContent && (")
    content = content.replace("                                    </div>\n                                </div>\n                            </div>\n                        )}\n                )}\n\n            </div>", "                                    </div>\n                                </div>\n                            </div>\n                        </div>\n                    )}\n                )}\n\n            </div>")
    
    # Stat fix
    content = content.replace(
        "                                                    <p className=\"text-2xl font-black\">{stat.value}</p>\n                                                </div>\n                                            })}}",
        "                                                    <p className=\"text-2xl font-black\">{stat.value}</p>\n                                                </div>\n                                            ))}"
    )

    with open("src/app/[locale]/t/[domain]/admin/page.tsx", "w") as f:
        f.write(content)

if __name__ == "__main__":
    reconstruct_v2()
