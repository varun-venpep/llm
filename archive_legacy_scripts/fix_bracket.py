with open("src/app/[locale]/t/[domain]/admin/page_backup.tsx", "r") as f:
    text = f.read()

t = """                                            </div>
                                        ))
                                        </div>
                                    )}"""
r = """                                            </div>
                                        ))}
                                        </div>
                                    )}"""
text = text.replace(t, r)
with open("test_page_bracket.tsx", "w") as f:
    f.write(text)
