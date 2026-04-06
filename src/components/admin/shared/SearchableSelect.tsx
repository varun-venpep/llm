'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

interface Option {
    id: string;
    name: string;
    description?: string;
}

interface SearchableSelectProps {
    label: string;
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    icon?: any;
}

export function SearchableSelect({
    label,
    options,
    value,
    onChange,
    placeholder = 'Search...',
    icon: Icon
}: SearchableSelectProps) {
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

    const selectedOption = useMemo(() => options.find(o => o.id === value), [options, value]);

    const filtered = useMemo(() => {
        const q = query.toLowerCase();
        return options.filter(o => 
            o.name.toLowerCase().includes(q) || 
            (o.description || '').toLowerCase().includes(q)
        ).sort((a, b) => {
            if (a.id === value) return -1;
            if (b.id === value) return 1;
            return a.name.localeCompare(b.name);
        });
    }, [options, query, value]);

    return (
        <div ref={ref} className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                {Icon && <Icon size={12} className="text-primary" />}
                {label}
            </label>

            <div className="relative">
                {/* Trigger */}
                <button
                    type="button"
                    onClick={() => setOpen(!open)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 bg-secondary/30 border rounded-xl transition-all ${open ? 'border-primary/50 ring-2 ring-primary/10 bg-background' : 'border-border/50 hover:border-border hover:bg-secondary/40'}`}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        {selectedOption ? (
                            <span className="text-sm font-bold truncate text-foreground">{selectedOption.name}</span>
                        ) : (
                            <span className="text-sm text-muted-foreground/50">{placeholder}</span>
                        )}
                    </div>
                    <ChevronDown size={14} className={`text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {open && (
                    <div className="absolute z-[100] top-full left-0 right-0 mt-2 bg-background border border-border/60 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        {/* Search bar inside dropdown */}
                        <div className="p-2 border-b border-border/20 bg-secondary/10">
                            <div className="relative flex items-center">
                                <Search size={13} className="absolute left-3 text-muted-foreground" />
                                <input
                                    autoFocus
                                    type="text"
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    placeholder="Type to filter..."
                                    className="w-full bg-background border border-border/40 rounded-lg pl-9 pr-8 py-2 text-xs outline-none focus:border-primary/50 transition-all font-medium"
                                    onClick={e => e.stopPropagation()}
                                />
                                {query && (
                                    <button 
                                        type="button" 
                                        onClick={(e) => { e.stopPropagation(); setQuery(''); }}
                                        className="absolute right-2 p-1 hover:bg-secondary rounded-md"
                                    >
                                        <X size={12} className="text-muted-foreground" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="max-h-60 overflow-y-auto divide-y divide-border/10">
                            {filtered.length === 0 ? (
                                <div className="px-4 py-8 text-center text-xs text-muted-foreground italic">
                                    No results matching "{query}"
                                </div>
                            ) : (
                                <>
                                    {/* "None" option if not mandatory or as a reset */}
                                    <button
                                        type="button"
                                        onClick={() => { onChange(''); setOpen(false); setQuery(''); }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${!value ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/50'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${!value ? 'border-primary bg-primary' : 'border-border'}`}>
                                            {!value && <Check size={10} className="text-primary-foreground" strokeWidth={4} />}
                                        </div>
                                        <span className="text-sm font-bold italic opacity-60">None / Unassigned</span>
                                    </button>

                                    {filtered.map(opt => {
                                        const isSelected = value === opt.id;
                                        return (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => { onChange(opt.id); setOpen(false); setQuery(''); }}
                                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/50'}`}
                                            >
                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'border-primary bg-primary' : 'border-border'}`}>
                                                    {isSelected && <Check size={10} className="text-primary-foreground" strokeWidth={4} />}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className={`text-sm font-bold truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>{opt.name}</p>
                                                    {opt.description && <p className="text-[10px] text-muted-foreground truncate">{opt.description}</p>}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
