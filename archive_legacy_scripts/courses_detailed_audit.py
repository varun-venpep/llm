with open("courses_tab.tsx", "r") as f:
    lines = f.readlines()

d, b, p = 0, 0, 0
for i, line in enumerate(lines):
    # Quick approximate count
    old_d = d
    old_b = b
    old_p = p
    
    # Strip string literals and comments for accurate brace counting
    clean_line = line.split("//")[0]
    
    # Divs
    d += clean_line.count("<div")
    d -= clean_line.count("</div")
    if "<div" in clean_line and "/>" in clean_line:
        d -= 1 # Self-closing heuristic
        
    # Braces
    b += clean_line.count("{")
    b -= clean_line.count("}")
    
    # Parens
    p += clean_line.count("(")
    p -= clean_line.count(")")
    
    if d != old_d or b != old_b or p != old_p:
        print(f"L{i+1} | D: {d} | B: {b} | P: {p} | {line.strip()[:40]}")
