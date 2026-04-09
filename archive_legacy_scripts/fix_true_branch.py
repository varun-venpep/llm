with open("src/app/[locale]/t/[domain]/admin/page_backup.tsx", "r") as f:
    text = f.read()

t = """                                </div>
                            </div> {/* End Flex Row (Div 7) */}
                        ) : ("""
r = """                                </div>
                                    </div>
                                </div>
                            </div> {/* End Flex Row (Div 7) */}
                        ) : ("""
text = text.replace(t, r)

with open("test_page_true.tsx", "w") as f:
    f.write(text)
