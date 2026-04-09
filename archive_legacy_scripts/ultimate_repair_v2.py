import re

def fix_file_v2():
    with open("src/app/[locale]/t/[domain]/admin/page_backup.tsx", "r") as f:
        lines = f.readlines()

    # Define the 10 problematic blocks with their line ranges in the backup
    # (Note: Using line numbers from my audit which uses 1-indexed)
    
    # 1. Stat map in courseStats (L1736)
    lines[1735] = lines[1735].replace("})}}", "))}")

    # 2. courses (L1659-2395) | Audit: +8
    # L2390 in backup was )) and should be })}
    # In backup, L2391 is </div> inside the ternary.
    # L2392 is )}
    # I'll fix this block closure:
    lines[2389] = lines[2389].replace("                                         ))", "                                         }))")
    lines[2390] = "                                     )}\n"
    # Rebalance: Insert the 8 divs before the closure
    # Wait! The grid div is closed at L2391 in backup?
    # L2391 was </div>.
    # L2392 was )}.
    # L2393 was </div> (for the Flex Row).
    # L2394 was </div> (for the space-y-6?)
    # L2395 was )}
    
    # Let's use a more surgical re-rewrite for the closures
    # First, fix the map end at L2390
    # Then, insert missing divs before the tab end at L2395
    indent = "                        "
    for _ in range(8):
        lines.insert(2394, f"{indent}    </div>\n")
        
    # 3. reports (L2478-2727) | Audit: +5
    # L2478: {activeTab === 'reports' && (() => {
    # Transform IIFE to conditional
    lines[2477] = lines[2477].replace(" && (() => {", " && (")
    # L2724 is );
    # L2725 is })()}
    # I'll remove them and replace with )}
    lines[2723] = "" # remove );
    lines[2724] = "                )}\n" # replace })()} with )}
    # Rebalance: Insert 5 divs before L2724 (now )} )
    for _ in range(5):
        lines.insert(2724, f"                </div>\n")

    # 4. branding (L2999-3134) | Audit: +7
    # L3134: )}
    for _ in range(7):
        lines.insert(3133, f"                            </div>\n")

    # 5. settings (L3170-3200) | Audit: +1
    lines.insert(3199, f"                            </div>\n")

    # 6. certificates (L3202-3229) | Audit: +1
    lines.insert(3228, f"                            </div>\n")

    # 7. selectedAnnouncement (L3819-3865) | Audit: +1
    lines.insert(3864, f"                                    </div>\n")

    # 8. insightsUserId (L4034-4160) | Audit: +2
    lines.insert(4159, f"                                    </div>\n")
    lines.insert(4159, f"                                    </div>\n")

    # 9. showProfileModal (L4161-4243) | Audit: +2
    lines.insert(4242, f"                                    </div>\n")
    lines.insert(4242, f"                                    </div>\n")

    # 10. confirmModal (L4244-4282) | Audit: +1
    lines.insert(4281, f"                                    </div>\n")

    # 11. showTranslationModal (L4284-4400) | Audit: +1
    lines.insert(4399, f"                                    </div>\n")

    with open("src/app/[locale]/t/[domain]/admin/page.tsx", "w") as f:
        f.writelines(lines)

    print("Robust surgical repair complete.")

if __name__ == "__main__":
    fix_file_v2()
