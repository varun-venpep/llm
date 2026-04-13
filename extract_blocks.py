with open("/Users/sowndarkumar/Cursor/LLM Live/llm/src/app/[locale]/t/[domain]/admin/page_backup.tsx", "r") as f:
    text = f.read()

import re

def extract(name, regex):
    match = re.search(regex, text, re.DOTALL)
    if match:
        content = match.group(1)
        with open(f"{name}.tsx", "w") as f:
            f.write(f"export default function {name}() {{\n  return (\n    <>\n{content}\n    </>\n  );\n}}\n")

extract("OverviewTab", r"\{activeTab === 'overview' && \(\s*<div.*?>(.*?)</div>\s*\)\}")
extract("CoursesTab", r"\{activeTab === 'courses' && \(\s*(<div.*?)</div>\s*\)\}")
