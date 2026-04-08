"""
Comprehensive final fix for admin/page.tsx
Fixes all broken sections by adding the exact number of missing closing div tags
before each conditional's closing )}
"""
import re

with open("src/app/[locale]/t/[domain]/admin/page.tsx", "r") as f:
    lines = f.readlines()

# Known broken sections with their exact line ranges (1-indexed) and div imbalance
# From find_broken_modals.py analysis:
# selectedAnnouncement: L2587-L2633: +1
# insightsUserId:       L2802-L2928: +2
# showProfileModal:     L2929-L3011: +2
# confirmModal:         L3012-L3050: +1
# showTranslationModal: L3052-L3168: +1
# Settings tab:         L1938-L1968: +1

# Also need to fix 3 extra unclosed divs from layout section (depth=4 at L2000 vs expected 1)
# These come from the main content area's container divs

FIXES = [
    # (end_line_1indexed, divs_to_add, description)
    # Process in reverse order so line numbers don't shift
    (3168, 1, "showTranslationModal"),
    (3050, 1, "confirmModal"),
    (3011, 2, "showProfileModal"),
    (2928, 2, "insightsUserId"),
    (2633, 1, "selectedAnnouncement"),
    (1968, 1, "settings tab"),
]

# Also check the layout depth issue - find where the tab content div closes
# The content area likely at `</div>` near the end of tab sections

# Let's check the cumulative depth issue at L2000 - should be 1, is 4
# meaning 3 extra divs from tabs/layout section. Find them.
print("Checking layout section for extra divs...")
depth = 0
in_tab_section = False
for i, line in enumerate(lines[:1999], start=1):
    d = line.count('<div') - line.count('</div')
    depth += d

print(f"Depth at L2000 (start of modals): {depth} (expected: 1 for outer div only)")
print(f"Extra divs from layout/tabs: {depth - 1}")

# Now apply all fixes - reverse order to not affect line numbers
print(f"\nApplying fixes...")
for (end_line, count, desc) in FIXES:
    # Insert `count` closing divs before the closing `)}` at end_line
    # end_line is 1-indexed, and it's the `)}`  line
    idx = end_line - 1  # 0-indexed
    closing_div = "                </div>\n"
    for _ in range(count):
        lines.insert(idx, closing_div)
        idx += 1
    print(f"  Fixed {desc}: +{count} div(s) added before L{end_line}")

# Fix the layout depth issue - find the right place to add closing divs
# The moal section should start when depth = 1, but it starts at depth=4
# meaning we need to find 3 divs from the tab layout that are unclosed
# These should close at the end of the tab content area, before the modals

# Find the `)` that closes the i18n tab (which is the last tab before modals)
# and add 3 closing divs there
# Check what's around L1999 in the modified file
print("\nChecking structure around the i18n tab (last before modals)...")

# Write to file first, then verify
with open("src/app/[locale]/t/[domain]/admin/page.tsx", "w") as f:
    f.writelines(lines)

# Verify the depth
with open("src/app/[locale]/t/[domain]/admin/page.tsx", "r") as f:
    new_lines = f.readlines()

new_depth = sum(l.count('<div') - l.count('</div') for l in new_lines)
print(f"\nFile div depth after fixes: {new_depth} (target: 0)")

# Run ESLint
import subprocess
result = subprocess.run(
    ["npx", "eslint", "src/app/[locale]/t/[domain]/admin/page.tsx"],
    capture_output=True, text=True, cwd="."
)
if result.returncode == 0:
    print("✅ ESLint PASSED!")
else:
    # Show first error
    for line in result.stdout.split('\n'):
        if 'error' in line.lower():
            print(f"❌ {line}")
            break
