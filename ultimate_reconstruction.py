import re

def reconstruct():
    with open("src/app/[locale]/t/[domain]/admin/page_backup.tsx", "r") as f:
        content = f.read()

    # 1. Courses Tab (L1659)
    # Target: the specific and uniquely broken closure at L2390+
    courses_old = """                                         ))
                                         </div>
                                     )}
                                 </div>
                             </div>
                         )}"""
    courses_new = """                                        ))}
                                    )}
                                </div>
                            </div>
                        )}
                    </div>"""
    content = content.replace(courses_old, courses_new)

    # 2. Reports Tab (L2478) - IIFE conversion
    reports_old = """                {activeTab === 'reports' && (() => {
                    const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
                    return (
                        <div className="space-y-6 animate-in fade-in duration-500 pb-10">"""
    reports_new = """                {activeTab === 'reports' && (
                        <div className="space-y-6 animate-in fade-in duration-500 pb-10">"""
    content = content.replace(reports_old, reports_new)
    
    # Reports closure
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
    branding_old = """                                    </div>
                                )}


                {/* ── SETTINGS ── */}"""
    branding_new = """                                    </div>
                                    </div>
                                    </div>
                                    </div>
                                    </div>
                                    </div>
                                    </div>
                                    </div>
                                )}


                {/* ── SETTINGS ── */}"""
    content = content.replace(branding_old, branding_new)

    # 4. Settings (+1)
    settings_old = """                                    </div>
                                )}

                {activeTab === 'certificates' && ("""
    settings_new = """                                    </div>
                                    </div>
                                )}

                {activeTab === 'certificates' && ("""
    content = content.replace(settings_old, settings_new)

    # 5. Certificates (+1)
    cert_old = """                                    </div>
                                )}
            </div>
        )}

        {showCourseModal && ("""
    cert_new = """                                    </div>
                                    </div>
                                )}
            </div>
        )}

        {showCourseModal && ("""
    content = content.replace(cert_old, cert_new)

    # 6. announcement (+1)
    ann_old = """                                    </div>
                                )}

            {managingResources && ("""
    ann_new = """                                    </div>
                                    </div>
                                )}

            {managingResources && ("""
    content = content.replace(ann_old, ann_new)

    # 7. insightsUserId (+2)
    insights_old = """                                    </div>
                                )}

            {showProfileModal && ("""
    insights_new = """                                    </div>
                                    </div>
                                    </div>
                                )}

            {showProfileModal && ("""
    content = content.replace(insights_old, insights_new)

    # 8. profileModal (+2)
    profile_old = """                                    </div>
                                )}

            {confirmModal && ("""
    profile_new = """                                    </div>
                                    </div>
                                    </div>
                                )}

            {confirmModal && ("""
    content = content.replace(profile_old, profile_new)

    # 9. confirmModal (+1)
    confirm_old = """                                    </div>
                                )}

                {showTranslationModal && translatingContent && ("""
    confirm_new = """                                    </div>
                                    </div>
                                )}

                {showTranslationModal && translatingContent && ("""
    content = content.replace(confirm_old, confirm_new)

    # 10. translationModal (+1)
    trans_old = """                                    </div>
                                </div>
                            </div>
                        )}
                )}"""
    trans_new = """                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                )}"""
    content = content.replace(trans_old, trans_new)

    # 11. Stat mapping closure fix (L1736) - be very specific
    content = content.replace(
        "                                                    <p className=\"text-2xl font-black\">{stat.value}</p>\n                                                </div>\n                                            })}}",
        "                                                    <p className=\"text-2xl font-black\">{stat.value}</p>\n                                                </div>\n                                            ))}"
    )

    with open("src/app/[locale]/t/[domain]/admin/page.tsx", "w") as f:
        f.write(content)

if __name__ == "__main__":
    reconstruct()
