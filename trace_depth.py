with open("src/app/[locale]/t/[domain]/admin/page.tsx", "r") as f:
    lines = f.readlines()

depth = sum(l.count('<div') - l.count('</div') for l in lines[:1999])
print(f"Depth entering L2000: {depth}")
print("\nAll div-changing lines from L2000 to end:")
for i, line in enumerate(lines[1999:], start=2000):
    d = line.count('<div') - line.count('</div')
    depth += d
    if d != 0:
        flag = " <<< HIGH" if depth > 6 else ""
        print(f"  L{i} (running={depth}): {line.rstrip()[:80]}{flag}")

print(f"\nFinal depth: {depth}")
