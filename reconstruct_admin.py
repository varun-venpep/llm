import re
import os
import subprocess

backup_path = "/Users/sowndarkumar/Cursor/LLM Live/llm/src/app/[locale]/t/[domain]/admin/page.tsx.bak"
target_path = "/Users/sowndarkumar/Cursor/LLM Live/llm/src/app/[locale]/t/[domain]/admin/page.tsx"

with open(backup_path, "r") as f:
    text = f.read()

# Extract the stable header (Everything before {/* ── OVERVIEW ── */})
header_match = re.search(r'([\s\S]*?)(\s*\{\/\*\s*── OVERVIEW ──\s*\*\/\})', text)
if not header_match:
    print("Could not find overview marker!")
    exit(1)

header = header_match.group(1)

skeleton = header + """
                {/* ── OVERVIEW ── */}
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        <div>Overview Component Placeholder</div>
                    </div>
                )}
            </main>
        </div>
    );
}
"""

with open(target_path, "w") as f:
    f.write(skeleton)

print("Minimal skeleton applied. Running audit...")
result = subprocess.run(["python3", "audit_full_comprehensive.py", target_path], capture_output=True, text=True)
print([line for line in result.stdout.split('\n') if "Final -" in line or "D:" in line][-10:])

