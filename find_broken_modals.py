"""
Systematically find all top-level conditional blocks in the modals section
and check their internal div balance.
"""
import re

with open("src/app/[locale]/t/[domain]/admin/page.tsx", "r") as f:
    lines = f.readlines()

# Modals section starts after certificates tab ends (~L2000)
MODAL_START = 2000  # 1-indexed

depth_before = sum(l.count('<div') - l.count('</div') for l in lines[:MODAL_START-1])
print(f"Cumulative depth entering modals section (L{MODAL_START}): {depth_before}")

# Find all conditional blocks: lines matching {something && ( at indent 12-16
i = MODAL_START - 1  # 0-indexed
while i < len(lines):
    line = lines[i]
    ln = i + 1
    
    # Pattern: {condition && ( at end of line, with 8-16 space indent
    if re.search(r'^\s{8,20}\{.*&&\s*\(\s*$', line) or re.search(r'^\s{8,20}\{.*&&\s*\(\(\s*$', line):
        indent_len = len(line) - len(line.lstrip())
        close_paren_indent = indent_len - 0  # same indent for )}, or indent-4
        
        # Track internal div balance
        inner_depth = 0
        found_end = False
        for j in range(i+1, min(i + 2000, len(lines))):
            l = lines[j]
            inner_depth += l.count('<div') - l.count('</div')
            
            # Check if this closes the conditional
            stripped = l.rstrip()
            # Various close patterns
            if (stripped in ['                )}', '            )}', '        )}', 
                             '            )};', '                )};'] and j > i + 3):
                end = j + 1
                color = "✅" if inner_depth == 0 else f"❌ ({inner_depth:+d})"
                print(f"L{ln}-L{end}: {color} | {line.strip()[:60]}")
                if inner_depth != 0:
                    print(f"    Last lines: {lines[j-1].rstrip()[:60]}")
                    print(f"               {lines[j].rstrip()[:60]}")
                i = j
                found_end = True
                break
        
        if not found_end:
            print(f"L{ln}: NO END FOUND | {line.strip()[:60]}")
    
    i += 1

print(f"\nFinal file div depth: {sum(l.count('<div') - l.count('</div') for l in lines)}")
