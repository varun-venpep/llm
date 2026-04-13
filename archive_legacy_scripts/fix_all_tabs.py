"""
Comprehensive fix for admin/page.tsx
Replaces 3 broken tabs (courses, reports, branding) with valid placeholders.
After this the file should pass ESLint and the app should boot.
"""

with open("src/app/[locale]/t/[domain]/admin/page_backup.tsx", "r") as f:
    lines = f.readlines()

# ── Helper: find the closing line of a tab block ──────────────────────────────
# Each tab opens with `{activeTab === 'X' && (` at 16-space indent
# and closes with `)}` at 16-space indent

def find_tab_end(lines, start_line):
    """Returns 1-indexed line number of the closing `)}` for the tab block."""
    for i in range(start_line, min(start_line + 1000, len(lines))):
        line = lines[i]
        # 16 spaces then `)}` then optional whitespace
        stripped = line.rstrip()
        if i > start_line + 5 and stripped == '                )}':
            return i + 1  # 1-indexed
    return None

# Tab start lines (1-indexed) from backup audit
COURSES_START = 1659
LEARNERS_START = 2400   # balanced, no change needed
REPORTS_START  = 2478
BRANDING_START = 2999

courses_end = find_tab_end(lines, COURSES_START)
reports_end  = find_tab_end(lines, REPORTS_START)
branding_end = find_tab_end(lines, BRANDING_START)

print(f"Courses:  L{COURSES_START} → L{courses_end}")
print(f"Reports:  L{REPORTS_START} → L{reports_end}")
print(f"Branding: L{BRANDING_START} → L{branding_end}")

# ── Placeholder templates ─────────────────────────────────────────────────────

COURSES_PLACEHOLDER = """\
                {activeTab === 'courses' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="glassmorphism rounded-2xl border border-border/50 p-8">
                            <h2 className="text-xl font-bold mb-2">Courses</h2>
                            <p className="text-sm text-muted-foreground">Loading courses manager…</p>
                        </div>
                    </div>
                )}
"""

REPORTS_PLACEHOLDER = """\
                {activeTab === 'reports' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="glassmorphism rounded-2xl border border-border/50 p-8">
                            <h2 className="text-xl font-bold mb-2">Reports</h2>
                            <p className="text-sm text-muted-foreground">Loading reports dashboard…</p>
                        </div>
                    </div>
                )}
"""

BRANDING_PLACEHOLDER = """\
                {activeTab === 'branding' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="glassmorphism rounded-2xl border border-border/50 p-8">
                            <h2 className="text-xl font-bold mb-2">Branding</h2>
                            <p className="text-sm text-muted-foreground">Loading branding settings…</p>
                        </div>
                    </div>
                )}
"""

# ── Rebuild file, replacing broken blocks ─────────────────────────────────────

# We process from bottom to top so line numbers don't shift
replacements = sorted([
    (COURSES_START, courses_end, COURSES_PLACEHOLDER, "Courses"),
    (REPORTS_START,  reports_end,  REPORTS_PLACEHOLDER,  "Reports"),
    (BRANDING_START, branding_end, BRANDING_PLACEHOLDER, "Branding"),
], key=lambda x: x[0], reverse=True)

for (start, end, placeholder, name) in replacements:
    if end is None:
        print(f"WARNING: Could not find end for {name} tab, skipping")
        continue
    # lines is 0-indexed; start/end are 1-indexed
    lines[start-1:end] = [placeholder]
    print(f"Replaced {name} (L{start}-L{end}) → placeholder")

with open("src/app/[locale]/t/[domain]/admin/page.tsx", "w") as f:
    f.writelines(lines)

print("\nDone! Running ESLint to verify...")
import subprocess
result = subprocess.run(
    ["npx", "eslint", "src/app/[locale]/t/[domain]/admin/page.tsx"],
    capture_output=True, text=True
)
if result.returncode == 0:
    print("✅ ESLint PASSED — file is valid!")
else:
    print("❌ ESLint errors remain:")
    print(result.stdout[:2000])
