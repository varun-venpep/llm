'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

interface Person {
    id: string;
    name?: string | null;
    email: string;
}

interface PeopleMultiSelectProps {
    label: string;
    icon?: any;
    people: Person[];
    selectedIds: string[];
    onToggle: (id: string) => void;
    placeholder?: string;
}

export function PeopleMultiSelect({ 
    label, 
    icon: Icon, 
    people, 
    selectedIds, 
    onToggle, 
    placeholder = 'Search...' 
}: PeopleMultiSelectProps) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const selectedPeople = useMemo(() => people.filter(p => selectedIds.includes(p.id)), [people, selectedIds]);

    const filtered = useMemo(() => {
        const q = query.toLowerCase();
        const matched = q
            ? people.filter(p => (p.name || '').toLowerCase().includes(q) || p.email?.toLowerCase().includes(q))
            : people;
        return [...matched].sort((a, b) => {
            const aS = selectedIds.includes(a.id), bS = selectedIds.includes(b.id);
            if (aS && !bS) return -1;
            if (!aS && bS) return 1;
            const aVal = a.name || a.email || '';
            const bVal = b.name || b.email || '';
            return aVal.localeCompare(bVal);
        });
    }, [people, query, selectedIds]);

    return (
        <div ref={ref} className="space-y-3">
            {/* Label row */}
            <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                    {Icon && <Icon size={12} className="text-primary" />}
                    {label}
                </label>
                {selectedIds.length > 0 && (
                    <span className="bg-primary/15 text-primary text-[10px] font-black px-2.5 py-0.5 rounded-full border border-primary/20">
                        {selectedIds.length} selected
                    </span>
                )}
            </div>

            {/* Pills */}
            {selectedPeople.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-3 bg-secondary/20 rounded-2xl border border-border/40 min-h-[42px]">
                    {selectedPeople.map(p => (
                        <span key={p.id} className="inline-flex items-center gap-1.5 bg-primary/15 text-primary text-xs font-bold px-3 py-1 rounded-xl border border-primary/20 group/pill">
                            {p.name || p.email}
                            <button type="button" onClick={() => onToggle(p.id)}
                                className="text-primary/60 hover:text-red-400 transition-colors ml-0.5">
                                <X size={10} strokeWidth={3} />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Search input */}
            <div
                className={`relative flex items-center gap-2 px-4 py-3 bg-background border rounded-xl cursor-text transition-all ${open ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border/50 hover:border-border'}`}
                onClick={() => setOpen(true)}
            >
                <Search size={13} className="text-muted-foreground flex-shrink-0" />
                <input
                    type="text"
                    value={query}
                    onChange={e => { setQuery(e.target.value); setOpen(true); }}
                    onClick={e => { e.stopPropagation(); setOpen(true); }}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40 font-medium"
                />
                {query ? (
                    <button type="button" onClick={e => { e.stopPropagation(); setQuery(''); }}>
                        <X size={13} className="text-muted-foreground hover:text-foreground" />
                    </button>
                ) : (
                    <ChevronDown size={13} className={`text-muted-foreground transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
                )}
            </div>

            {/* Dropdown */}
            {open && (
                <div className="rounded-2xl border border-border/50 bg-background shadow-2xl shadow-black/30 overflow-hidden animate-in slide-in-from-top-2 duration-150">
                    <div className="max-h-52 overflow-y-auto divide-y divide-border/20">
                        {filtered.length === 0 ? (
                            <p className="text-xs text-muted-foreground px-5 py-5 text-center italic">No results for "{query}"</p>
                        ) : filtered.map(p => {
                            const isSel = selectedIds.includes(p.id);
                            return (
                                <label key={p.id} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors select-none ${isSel ? 'bg-primary/8' : 'hover:bg-secondary/50'}`}>
                                    <div className={`w-4 h-4 rounded border-[1.5px] flex items-center justify-center flex-shrink-0 transition-all ${isSel ? 'bg-primary border-primary' : 'border-border/60'}`}>
                                        {isSel && <Check size={9} className="text-primary-foreground" strokeWidth={3} />}
                                    </div>
                                    <input type="checkbox" checked={isSel} onChange={() => onToggle(p.id)} className="sr-only" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold truncate">{p.name || p.email}</p>
                                        {p.name && <p className="text-[10px] text-muted-foreground truncate">{p.email}</p>}
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                    {filtered.length > 0 && (
                        <div className="px-4 py-2 border-t border-border/20 bg-secondary/10">
                            <p className="text-[10px] text-muted-foreground">{filtered.length} {query ? 'matching' : 'available'} · {selectedIds.length} selected</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
