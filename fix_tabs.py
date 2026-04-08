with open("/Users/sowndarkumar/Cursor/LLM Live/llm/src/app/[locale]/t/[domain]/admin/page_backup.tsx", "r") as f:
    text = f.read()

# 1. Overview tab ends at 1658. It needs 6 closing divs.
# 1658:                     </div>
#                   )}
text = text.replace(
"""                    </div>
                )}

                {/* ── COURSES ── */}""",
"""                    </div>
""" + ("</div>" * 6) + """
                )}

                {/* ── COURSES ── */}"""
)

# 2. Courses tab
# Wait, courses tab has True and False branch.
# We found Builder View (True branch) leaked 3 divs. Let's add them before `) : (` at 2303.
text = text.replace(
"""                            </div> {/* End Flex Row (Div 7) */}
                        ) : (""",
"""                            </div> {/* End Flex Row (Div 7) */}
""" + ("</div>" * 3) + """
                        ) : ("""
)

# List View (False branch) leaked some divs? We determined the false branch itself leaked 0 divs!
# But let's check the end of the courses tab (2395). We replaced `2391: </div>` with empty, let's keep it deleted.
text = text.replace(
"""                                        ))
                                        </div>
                                    )}""",
"""                                        ))
                                    )}"""
)

# Wait! The Courses tab also leaked 1 div overall?
# Let's just add 1 div at the very end of Courses before `)}`.
text = text.replace(
"""                            </div>
                        )}
                    </div>
                )}""",
"""                            </div>
                        )}
                    </div>
""" + ("</div>" * 1) + """
                )}"""
)

# 3. Reports tab leaked 9 divs!
text = text.replace(
"""                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                )}""",
"""                                    </div>
                                </div>
                            </div>
""" + ("</div>" * 9) + """
                        );
                    })()}
                )}"""
)

# 4. Branding tab leaked 6 divs!
text = text.replace(
"""                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}""",
"""                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
""" + ("</div>" * 6) + """
                )}"""
)

with open("temp_fix.tsx", "w") as f:
    f.write(text)
