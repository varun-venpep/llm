with open("src/app/[locale]/t/[domain]/admin/page_backup.tsx", "r") as f:
    text = f.read()

# Fix 1: Missing div before glassmorphism (Line 2228-2229)
t1 = """                                        {validationErrors.newModule && <p className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-right-1 ml-1">{validationErrors.newModule}</p>}
                                    <div className="glassmorphism"""
r1 = """                                        {validationErrors.newModule && <p className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-right-1 ml-1">{validationErrors.newModule}</p>}
                                    </div>
                                    <div className="glassmorphism"""
text = text.replace(t1, r1)

# Fix 2: Errant closing div (Line 2391)
t2 = """                                            </div>
                                        ))
                                        </div>
                                    )}"""
r2 = """                                            </div>
                                        ))
                                    )}"""
text = text.replace(t2, r2)

with open("test_page.tsx", "w") as f:
    f.write(text)
