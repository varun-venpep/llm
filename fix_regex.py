with open("src/app/[locale]/t/[domain]/admin/page_backup.tsx", "r") as f:
    text = f.read()

t2 = """                                        ))
                                        </div>
                                    )}"""
r2 = """                                        ))
                                        )
                                        </div>
                                    )}"""
text = text.replace(t2, r2)
with open("src/app/[locale]/t/[domain]/admin/page.tsx", "w") as f:
    f.write(text)
