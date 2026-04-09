import re
with open("src/app/[locale]/t/[domain]/admin/page_backup.tsx", "r") as f:
    text = f.read()

# Replace the courses view and perfectly close the hierarchical parent tags
courses_match = re.search(r"\{\/\* ── Courses View ── \*\/([\s\S]*?)(?=\{\/\* ── LEARNERS ── \*\/)", text)
if courses_match:
    full_block = courses_match.group(0)
    placeholder = """{/* ── Courses View ── */}
                            <div className="space-y-6">
                                <div className="p-6 bg-secondary/10 rounded-xl border border-border/50">
                                    <h2 className="text-xl font-bold">Courses Loaded</h2>
                                    <p className="text-sm text-foreground/70">The courses view AST is currently under reconstruction.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                """
    text = text.replace(full_block, placeholder)

with open("src/app/[locale]/t/[domain]/admin/page.tsx", "w") as f:
    f.write(text)
