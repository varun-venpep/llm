import re

def fix_file():
    with open("src/app/[locale]/t/[domain]/admin/page_backup.tsx", "r") as f:
        content = f.read()

    # 1. Fix courses tab map closure (L2390-2391 in backup)
    # Original in backup:
    # L2390:                                         ))
    # L2391:                                         </div>
    # L2392:                                     )}
    # L2393:                                 </div>
    # L2394:                             </div>
    # L2395:                         )}
    content = content.replace(
        "                                         ))\n                                         </div>\n                                     )}",
        "                                         }))\n                                     )}\n                                 </div>\n                             </div>\n                         )}"
    )

    # 2. Fix Reports tab IIFE (L2478-2725 in backup)
    # L2478: {activeTab === 'reports' && (() => {
    # L2725:                 })()}
    content = content.replace(
        "{activeTab === 'reports' && (() => {",
        "{activeTab === 'reports' && ("
    )
    # Find the closure and fix it (plus 5 missing divs)
    reports_closure = "                })()}\n                </div>\n            )}"
    reports_fixed = "                })}\n                </div>\n                </div>\n                </div>\n                </div>\n                </div>\n                </div>\n            )}"
    content = content.replace(reports_closure, reports_fixed)

    # 3. Branding (+7)
    branding_closure = "{/* ── BRANDING ── */}\n                {activeTab === 'branding' && ("
    # We find where it ends
    # L3134 in backup:                                    </div>\n                                )}\n
    content = content.replace(
        "                                    </div>\n                                )}\n",
        "                                    </div>\n                                </div>\n                                </div>\n                                </div>\n                                </div>\n                                </div>\n                                </div>\n                                </div>\n                                )}\n"
    )

    # 4. Settings (+1)
    content = content.replace(
        "                                    </div>\n                                )}\n                \n                {activeTab === 'certificates'",
        "                                    </div>\n                                </div>\n                                )}\n                \n                {activeTab === 'certificates'"
    )

    # 5. Certificates (+1)
    content = content.replace(
        "                                    </div>\n                                )}\n            </div>\n        )}\n\n        {showCourseModal",
        "                                    </div>\n                                </div>\n                                )}\n            </div>\n        )}\n\n        {showCourseModal"
    )

    # 6. SelectedAnnouncement (+1)
    content = content.replace(
        "                                    </div>\n                                )}\n\n            {managingResources && (",
        "                                    </div>\n                                </div>\n                                )}\n\n            {managingResources && ("
    )

    # 7. InsightsUserId (+2)
    content = content.replace(
        "                                    </div>\n                                )}\n\n            {showProfileModal && (",
        "                                    </div>\n                                </div>\n                                </div>\n                                )}\n\n            {showProfileModal && ("
    )

    # 8. ShowProfileModal (+2)
    content = content.replace(
        "                                    </div>\n                                )}\n\n            {confirmModal && (",
        "                                    </div>\n                                </div>\n                                </div>\n                                )}\n\n            {confirmModal && ("
    )

    # 9. ConfirmModal (+1)
    content = content.replace(
        "                                    </div>\n                                )}\n\n                {showTranslationModal && translatingContent && (",
        "                                    </div>\n                                </div>\n                                )}\n\n                {showTranslationModal && translatingContent && ("
    )

    # 10. ShowTranslationModal (+1)
    content = content.replace(
        "                                    </div>\n                                </div>\n                            </div>\n                        )}\n                )}\n\n            </div>",
        "                                    </div>\n                                </div>\n                            </div>\n                        </div>\n                    )}\n                )}\n\n            </div>"
    )
    
    # 11. Stat map fix (L1736)
    content = content.replace("                                            })}}", "                                            ))}")

    with open("src/app/[locale]/t/[domain]/admin/page.tsx", "w") as f:
        f.write(content)

if __name__ == "__main__":
    fix_file()
