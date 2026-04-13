with open("src/app/[locale]/t/[domain]/admin/page_backup.tsx", "r") as f:
    text = f.read()

# Replace the errant closing div with the missing paren if that's what Babel wants
t2 = """                                        ))
                                        </div>
                                    )}"""
r2 = """                                        ))
                                        )</div>
                                    )}"""
text = text.replace(t2, r2)
with open("test_page2.tsx", "w") as f:
    f.write(text)
