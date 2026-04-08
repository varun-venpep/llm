with open("src/app/[locale]/t/[domain]/admin/page.tsx", "r") as f:
    text = f.read()

import re
# Match the start of Courses to the start of LEARNERS perfectly.
match = re.search(r"(\{\/\* ── COURSES ── \*\/[\s\S]*?)(\{\/\* ── LEARNERS ── \*\/)", text)
if match:
    full_block = match.group(1)
    placeholder = """{/* ── COURSES ── */}
                {activeTab === 'courses' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="p-6 bg-secondary/10 rounded-xl border border-border/50">
                            <h2 className="text-xl font-bold">Courses Area</h2>
                        </div>
                    </div>
                )}
                
                """
    text = text.replace(full_block, placeholder)

with open("src/app/[locale]/t/[domain]/admin/page.tsx", "w") as f:
    f.write(text)
