with open("src/app/[locale]/t/[domain]/admin/page_backup.tsx", "r") as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    if ") : (" in line and "Courses View" in lines[i+1]:
        # Right before the list view begins, force close the 4 leaked divs from the builder view
        new_lines.append("                                </div></div></div></div>\n")
        new_lines.append(line)
    elif ") }" in line.replace(" ", "") and "LEARNERS" in lines[i+4]:
        # Wait, find the exact closing
        pass
    else:
        new_lines.append(line)

with open("temp_balance.tsx", "w") as f:
    f.writelines(new_lines)
