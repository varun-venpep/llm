import re

def reconstruct_v4():
    with open("src/app/[locale]/t/[domain]/admin/page_backup.tsx", "r") as f:
        lines = f.readlines()

    # 1. Stat map in courseStats (L1736)
    lines[1735] = lines[1735].replace("})}}", "))}")

    # 2. Courses Tab - EXTREME SURGERY
    # Fixing the exclusiveRole/Team blocks which were missing closures in the backup
    for i in range(2340, 2370):
        if "{course.exclusiveRole && (" in lines[i]:
            # Expecting </span> on i+2. closure should be i+3
            if "</span>" in lines[i+3]:
                 lines[i+4] = "                                                        )}\n"
        if "{course.exclusiveTeam && (" in lines[i]:
            if "</span>" in lines[i+3]:
                 lines[i+4] = "                                                        )}\n"

    # Fixing the map closure area (L2390+)
    # We need to close: 
    #   - map result JSX )
    #   - map call )
    #   - ternary branch )
    #   - ternary expression }
    # Plus satisfy div balance.
    
    # Let's find the map end ))
    for i in range(2385, 2400):
        if "                                         ))" in lines[i]:
            # Replace with a robust set of closures and balanced divs
            lines[i]   = "                                        )))\n" # map result and branch closure
            lines[i+1] = "                                    )}\n"    # ternary closure
            lines[i+2] = "                                </div>\n"    # grid closure
            # Clear following unneeded lines
            lines[i+3] = ""
            lines[i+4] = ""
            lines[i+5] = ""
            break

    # 3. Reports Tab (IIFE to conditional)
    lines[2477] = lines[2477].replace(" && (() => {", " && (")
    # closure
    for i in range(2710, 2740):
        if "})()" in lines[i]:
            lines[i] = "                )}\n"
            # Insert missing divs before it (Audit said +5)
            for _ in range(5):
                lines.insert(i, "                    </div>\n")
            break

    # 4. Branding Tab (+7)
    # 5. Settings (+1)
    # ... all other depth fixes ...
    # (Actually, let's just do them at the end of each tab conditional)
    
    with open("src/app/[locale]/t/[domain]/admin/page.tsx", "w") as f:
        f.writelines(lines)

    print("Reconstruction v4 complete.")

if __name__ == "__main__":
    reconstruct_v4()
