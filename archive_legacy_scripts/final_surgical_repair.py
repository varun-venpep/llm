import re

def final_surgical_repair():
    with open("src/app/[locale]/t/[domain]/admin/page.tsx", "r") as f:
        content = f.read()

    # 1. Stat map in courseStats (L1736)
    content = content.replace("                                            })}}", "                                            ))}")

    # 2. Courses map/ternary closure (L2390-2397)
    # Original in backup:
    # L2390:                                         ))
    # L2391:                                         </div>
    # L2392:                                     )}
    # L2393:                                 </div>
    # L2394:                             </div>
    # L2395:                         )}
    courses_old = """                                         ))
                                         </div>
                                     )}
                                 </div>
                             </div>
                         )}"""
    # Fix: Correct map end )) and ternary end )}, then add 8 missing divs.
    courses_new = """                                        ))}
                                    )}
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

    # 3. Reports Tab IIFE Conversion (L2478-2727)
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

    # 4. Branding Tab (+7 divs)
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

    # 5. Settings (+1 div)
    content = content.replace(
        "                                    </div>\n                                )}\n\n                {activeTab === 'certificates' && (",
        "                                    </div>\n                                    </div>\n                                )}\n\n                {activeTab === 'certificates' && ("
    )

    # 6. Certificates (+1 div)
    content = content.replace(
        "                                    </div>\n                                )}\n            </div>\n        )}\n\n        {showCourseModal && (",
        "                                    </div>\n                                    </div>\n                                )}\n            </div>\n        )}\n\n        {showCourseModal && ("
    )

    # 7. SelectedAnnouncement (+1 div)
    content = content.replace(
        "                                    </div>\n                                )}\n\n            {managingResources && (",
        "                                    </div>\n                                    </div>\n                                )}\n\n            {managingResources && ("
    )

    # 8. Modals: insightsUserId (+2), activeQuizLesson (+2), showProfileModal (+2), confirmModal (+1), showTranslationModal (+1)
    # Total unclosed divs before main tag should be 0.
    
    # InsightsUserId
    content = content.replace(
        "                                    </div>\n                                )}\n\n            {showProfileModal && (",
        "                                    </div>\n                                    </div>\n                                    </div>\n                                )}\n\n            {showProfileModal && ("
    )
    
    # ProfileModal
    content = content.replace(
        "                                    </div>\n                                )}\n\n            {confirmModal && (",
        "                                    </div>\n                                    </div>\n                                    </div>\n                                )}\n\n            {confirmModal && ("
    )
    
    # ConfirmModal
    content = content.replace(
        "                                    </div>\n                                )}\n\n                {showTranslationModal && translatingContent && (",
        "                                    </div>\n                                    </div>\n                                )}\n\n                {showTranslationModal && translatingContent && ("
    )
    
    # TranslationModal
    content = content.replace(
        "                                    </div>\n                                </div>\n                            </div>\n                        )}\n                )}\n\n            </div>",
        "                                    </div>\n                                </div>\n                            </div>\n                        </div>\n                    )}\n                )}\n\n            </div>"
    )

    # 9. Main tag closure (L4428 in backup)
    # Replaced by )}\n </div>\n </div>\n </div>... logic above.

    with open("src/app/[locale]/t/[domain]/admin/page.tsx", "w") as f:
        f.write(content)

if __name__ == "__main__":
    final_surgical_repair()
