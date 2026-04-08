with open("courses_tab.tsx") as f:
    lines = f.readlines()[:645]

opened_divs = []
for i, line in enumerate(lines):
    # simple heuristic: count '<div' vs '</div'
    opens = line.count("<div")
    
    # account for <div ... />
    self_closes = 0
    idx = 0
    while "<div" in line[idx:]:
        pos = line.find("<div", idx)
        close_pos = line.find(">", pos)
        if close_pos != -1 and line[close_pos-1] == "/":
            self_closes += 1
        idx = pos + 4
        
    closes = line.count("</div")
    
    net = opens - self_closes - closes
    if net > 0:
        for _ in range(net):
            opened_divs.append((i+1, line.strip()))
    elif net < 0:
        for _ in range(abs(net)):
            if opened_divs:
                opened_divs.pop()

print("Unclosed divs remaining:")
for lineno, text in opened_divs:
    print(f"L{lineno}: {text[:60]}")
