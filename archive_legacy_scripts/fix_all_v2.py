import os

with open("src/app/[locale]/t/[domain]/admin/page_backup.tsx", "r") as f:
    text = f.read()

# Fix 1: Courses
c_target = """                                            </div>
                                        ))
                                        </div>
                                    )}
                                </div>"""
c_replace = """                                            </div>
                                        ))
                                    )}
                                </div>"""
if c_target in text:
    text = text.replace(c_target, c_replace)
    print("Fixed Courses!")
else:
    print("Courses target not found")

# Fix 2: Reports
r_target = """                    );
                })()}
                </div>
            )}"""
r_replace = """                    );
                })()}
                            </div>
                        </div>
                    </div>
                )}"""
if r_target in text:
    text = text.replace(r_target, r_replace)
    print("Fixed Reports!")
else:
    print("Reports target not found")

# Fix 3: Branding
b_target = """                                        <button className="w-full py-2.5 rounded-xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/5" 
                                            style={{ backgroundColor: branding.primaryColor }}>
                                            Join Learning Path
                                        </button>
                                    </div>
                    </div>
                    </div>
                    </div>
                )}"""
b_replace = """                                        <button className="w-full py-2.5 rounded-xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/5" 
                                            style={{ backgroundColor: branding.primaryColor }}>
                                            Join Learning Path
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}"""
if b_target in text:
    text = text.replace(b_target, b_replace)
    print("Fixed Branding!")
else:
    print("Branding target not found")

with open("src/app/[locale]/t/[domain]/admin/page.tsx", "w") as f:
    f.write(text)

