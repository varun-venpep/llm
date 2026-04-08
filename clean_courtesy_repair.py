import re

def clean_courtesy_repair():
    with open("src/app/[locale]/t/[domain]/admin/page_backup.tsx", "r") as f:
        content = f.read()

    # 1. Courses Tab (L2328-L2391)
    # We will remove the outer branches' parentheses to clarify the structure.
    
    # Replace the loading ? ( with loading ? 
    content = content.replace("                                    {loading ? (", "                                    {loading ?")
    
    # Replace the ) : ( with : 
    content = content.replace("                                    ) : count === 0 ? (", "                                    : count === 0 ?")
    content = content.replace("                                    ) : (", "                                    : (")
    
    # Fix the map closure area
    # Original:
    # L2390:                                         ))
    # L2391:                                         </div>
    # L2392:                                     )}
    
    # New:
    courses_old = """                                         ))
                                         </div>
                                     )}
                                 </div>
                             </div>
                         )}"""
    # Closing map )) plus closing branch 3 ) plus closing ternary block }
    courses_new = """                                        ))
                                    )
                                }
                            </div>
                        </div>
                    </div>
                )}"""
    content = content.replace(courses_old, courses_new)

    # 2. Stat map closure (1736)
    content = content.replace("                                            })}}", "                                            ))}")

    # 3. Reports Tab (IIFE to conditional)
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
                )}"""
    content = content.replace(reports_closure_old, reports_closure_new)

    # 4. Branding Tab (+7)
    content = content.replace(
        "                                    </div>\n                                )}\n\n\n                {/* ── SETTINGS ── */}",
        "                                    </div>\n                                    </div>\n                                    </div>\n                                    </div>\n                                    </div>\n                                    </div>\n                                    </div>\n                                    </div>\n                                )}\n\n\n                {/* ── SETTINGS ── */}"
    )

    with open("src/app/[locale]/t/[domain]/admin/page.tsx", "w") as f:
        f.write(content)

if __name__ == "__main__":
    clean_courtesy_repair()
