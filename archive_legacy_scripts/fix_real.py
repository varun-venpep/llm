with open("src/app/[locale]/t/[domain]/admin/page_backup.tsx", "r") as f:
    text = f.read()

# Fix 1: Missing div before glassmorphism (Line 2228-2229)
t1 = """                                        {validationErrors.newModule && <p className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-right-1 ml-1">{validationErrors.newModule}</p>}
                                    <div className="glassmorphism"""
r1 = """                                        {validationErrors.newModule && <p className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-right-1 ml-1">{validationErrors.newModule}</p>}
                                    </div>
                                    <div className="glassmorphism"""
text = text.replace(t1, r1)

# Fix 2: Remove the extra div from the end of the true branch
t2 = """                                </div>
                            </div> {/* End Flex Row (Div 7) */}
                        ) : ("""
r2 = """                                </div>
                        ) : ("""
text = text.replace(t2, r2)

# Fix 3: Remove the errant trailing div in the map false branch
t3 = """                                            </div>
                                        ))
                                        </div>
                                    )}"""
r3 = """                                            </div>
                                        ))
                                    )}"""
text = text.replace(t3, r3)

with open("test_page_real.tsx", "w") as f:
    f.write(text)
