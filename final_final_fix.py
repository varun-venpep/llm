import re

def final_fix():
    with open("src/app/[locale]/t/[domain]/admin/page.tsx", "r") as f:
        content = f.read()

    # The goal is to fix the courses tab block once and for all.
    # L1659: {activeTab === 'courses' && (
    # ...
    # L2327: <div className="grid ...">
    # L2328: {loading ? (
    # ...
    # L2343: ) : (
    # L2344: courses.filter(...).map((course) => (
    # ...
    # Now we must close:
    # 1. The map: ))
    # 2. The ternary branch: )
    # 3. The ternary: }
    # 4. The grid div: </div>
    # 5. ... any other parent divs ...
    # 6. The tab conditional: )}
    
    # Let's fix the closure area around L2390
    # Current state after my last edit:
    # 2389:                                             </div>
    # 2390:                                         ))
    # 2391:                                     </div>
    # ... Many divs ...
    # 2403:                                     )}
    # 2404:                         )}
    
    # I'll replace the block from )) to )} with the correct sequence.
    # To be safe, I'll use a multi-line regex with some anchor.
    
    pattern = r'\)\)\s+</div>\s+</div>\s+</div>\s+</div>\s+</div>\s+</div>\s+</div>\s+</div>\s+</div>\s+</div>\s+</div>\s+</div>\s+\)}\s+\)}\s+</div>\s+\)}'
    replacement = r'''))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}'''
    
    # Wait, that's too specific. Let's just fix the map end and the following lines.
    lines = content.splitlines()
    
    for i in range(1650, 2450):
        if i < len(lines) and "                                        ))" in lines[i]:
            # This is L2390
            lines[i] = "                                        ))"
            lines[i+1] = "                                    )}"
            lines[i+2] = "                                </div>"
            lines[i+3] = "                            </div>"
            lines[i+4] = "                        )}"
            lines[i+5] = "                    </div>"
            lines[i+6] = "                )}"
            # Clear out the extra divs I added
            for j in range(i+7, i+20):
                if j < len(lines) and "</div>" in lines[j] and lines[j].strip() == "</div>":
                    lines[j] = ""
                elif j < len(lines) and ")}" in lines[j]:
                    lines[j] = ""
            break
            
    with open("src/app/[locale]/t/[domain]/admin/page.tsx", "w") as f:
        f.write("\n".join(lines) + "\n")

if __name__ == "__main__":
    final_fix()
