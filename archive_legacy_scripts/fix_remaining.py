with open("src/app/[locale]/t/[domain]/admin/page.tsx", "r") as f:
    text = f.read()

# Fix Reports Balance
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

# Fix Branding Balance
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

with open("src/app/[locale]/t/[domain]/admin/page.tsx", "w") as f:
    f.write(text)
