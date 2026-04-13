with open("courses_tab.tsx") as f:
    lines = f.readlines()[:645]

opened_divs = []
for i, line in enumerate(lines):
    clean = line.split("//")[0]
    idx = 0
    while "<div" in clean[idx:]:
        pos = clean.find("<div", idx)
        # Check if it's self-closing
        if clean.find("/>", pos) != -1 and clean.find(">", pos) == clean.find("/>", pos) + 1:
            pass # Self-closing
        else:
            opened_divs.append((i+1, clean.strip()))
        idx = pos + 4

    idx = 0
    while "</div" in clean[idx:]:
        pos = clean.find("</div", idx)
        if opened_divs:
            opened_divs.pop()
        idx = pos + 5

print(f"Total unclosed: {len(opened_divs)}")
for lineno, text in opened_divs:
    print(f"L{lineno}: {text[:60]}")
