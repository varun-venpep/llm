'use client';

import { useState, useEffect, useRef } from 'react';
import { Save, ChevronLeft, Type, Move, Palette, Maximize, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

interface DesignField {
    id: string;
    text: string;
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    fontSize: number;
    color: string;
    fontWeight: string;
    alignment: 'left' | 'center' | 'right';
}

interface Template {
    id: string;
    name: string;
    backgroundImage: string;
    designFields?: any;
}

interface CertificateDesignerProps {
    template: Template;
    onBack: () => void;
    onSave: (id: string, designFields: any) => void;
}

const DEFAULT_FIELDS: DesignField[] = [
    { id: 'name', text: '{{Learner Name}}', x: 50, y: 45, fontSize: 36, color: '#111827', fontWeight: 'bold', alignment: 'center' },
    { id: 'course', text: '{{Course Title}}', x: 50, y: 58, fontSize: 24, color: '#374151', fontWeight: 'semibold', alignment: 'center' },
    { id: 'date', text: '{{Completion Date}}', x: 50, y: 75, fontSize: 14, color: '#6B7280', fontWeight: 'normal', alignment: 'center' },
    { id: 'serial', text: 'ID: {{Certificate ID}}', x: 50, y: 82, fontSize: 10, color: '#9CA3AF', fontWeight: 'normal', alignment: 'center' },
];

export default function CertificateDesigner({ template, onBack, onSave }: CertificateDesignerProps) {
    const [fields, setFields] = useState<DesignField[]>(template.designFields?.fields || DEFAULT_FIELDS);
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedField = fields.find(f => f.id === selectedFieldId);

    const updateField = (id: string, updates: Partial<DesignField>) => {
        setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const handleDrag = (e: React.MouseEvent | React.TouchEvent, id: string) => {
        const container = containerRef.current;
        if (!container) return;

        const move = (moveEvent: any) => {
            const rect = container.getBoundingClientRect();
            const clientX = moveEvent.type === 'touchmove' ? moveEvent.touches[0].clientX : moveEvent.clientX;
            const clientY = moveEvent.type === 'touchmove' ? moveEvent.touches[0].clientY : moveEvent.clientY;
            
            const x = Math.min(Math.max(((clientX - rect.left) / rect.width) * 100, 0), 100);
            const y = Math.min(Math.max(((clientY - rect.top) / rect.height) * 100, 0), 100);
            
            updateField(id, { x, y });
        };

        const stop = () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', stop);
            window.removeEventListener('touchmove', move);
            window.removeEventListener('touchend', stop);
        };

        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', stop);
        window.addEventListener('touchmove', move);
        window.addEventListener('touchend', stop);
    };

    const handleSave = async () => {
        setSaving(true);
        await onSave(template.id, { fields });
        setSaving(false);
    };

    return (
        <div className="flex flex-col lg:flex-row h-full gap-8 animate-in slide-in-from-right-4 duration-500 overflow-hidden min-h-[700px]">
            {/* Main Designer Area */}
            <div className="flex-1 flex flex-col gap-4 min-h-0">
                <div className="flex items-center justify-between">
                    <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronLeft size={16} /> Back to Library
                    </button>
                    <div className="flex items-center gap-3">
                         <span className="text-xs font-bold text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full border border-border/50">
                            Editing: <span className="text-primary">{template.name}</span>
                         </span>
                         <button 
                            onClick={handleSave} 
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs rounded-xl shadow-xl shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            {saving ? 'Saving...' : 'Save Design'}
                        </button>
                    </div>
                </div>

                <div 
                    ref={containerRef}
                    className="relative flex-1 bg-secondary/20 rounded-[2.5rem] border-4 border-border/10 overflow-hidden shadow-inner flex items-center justify-center p-8 group"
                >
                    <div className="relative aspect-[1.414/1] w-full max-w-4xl shadow-2xl rounded-sm group-hover:scale-[1.01] transition-transform duration-500">
                        {/* Background */}
                        <img 
                            src={template.backgroundImage || 'https://images.unsplash.com/photo-1544391682-17fe04257eb0?w=1200&auto=format&fit=crop&q=80'} 
                            alt="Certificate Background"
                            className="w-full h-full object-cover select-none pointer-events-none"
                        />

                        {/* Overlay Fields */}
                        {fields.map((field) => (
                            <div 
                                key={field.id}
                                onMouseDown={(e) => { setSelectedFieldId(field.id); handleDrag(e, field.id); }}
                                onTouchStart={(e) => { setSelectedFieldId(field.id); handleDrag(e, field.id); }}
                                style={{ 
                                    position: 'absolute',
                                    left: `${field.x}%`,
                                    top: `${field.y}%`,
                                    transform: `translate(${field.alignment === 'center' ? '-50%' : field.alignment === 'right' ? '-100%' : '0'}, -50%)`,
                                    cursor: 'move',
                                    fontSize: `${field.fontSize}px`,
                                    color: field.color,
                                    fontWeight: field.fontWeight === 'bold' ? '900' : field.fontWeight === 'semibold' ? '700' : '400',
                                    textAlign: field.alignment,
                                    whiteSpace: 'nowrap',
                                    userSelect: 'none',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    border: selectedFieldId === field.id ? '2px solid #3b82f6' : '2px solid transparent',
                                    backgroundColor: selectedFieldId === field.id ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                                }}
                                className="transition-[border,background-color] duration-200"
                            >
                                {field.text}
                                {selectedFieldId === field.id && (
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-blue-600 text-white text-[8px] font-black uppercase rounded shadow-lg">
                                        Active
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    
                    {/* Guidance Overlay */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white/70 text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                        <Move size={12} className="inline mr-2" /> Drag labels to position them perfectly
                    </div>
                </div>
            </div>

            {/* Sidebar Property Editor */}
            <aside className="w-full lg:w-80 shrink-0 border-l border-border/50 pl-0 lg:pl-8 space-y-6 animate-in slide-in-from-bottom-4 lg:slide-in-from-right-4 duration-700">
                <div className="space-y-1">
                    <h3 className="font-black uppercase tracking-tight text-lg">Field Inspector</h3>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Adjust typography & placement</p>
                </div>

                {!selectedField ? (
                    <div className="p-8 border-2 border-dashed border-border/50 rounded-3xl flex flex-col items-center justify-center text-center space-y-3 bg-secondary/5">
                        <div className="w-12 h-12 rounded-full bg-secondary/30 flex items-center justify-center text-muted-foreground">
                            <Type size={20} />
                        </div>
                        <p className="text-sm font-bold text-muted-foreground">Select a field on the canvas to edit its properties.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Target Field</p>
                            <p className="font-bold text-sm tracking-tight">{selectedField.text}</p>
                        </div>

                        {/* Font Size */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Maximize size={10} /> Font Size</label>
                                <span className="font-mono text-xs font-bold">{selectedField.fontSize}px</span>
                            </div>
                            <input 
                                type="range" min="8" max="120" 
                                value={selectedField.fontSize}
                                onChange={(e) => updateField(selectedField.id, { fontSize: parseInt(e.target.value) })}
                                className="w-full accent-primary"
                            />
                        </div>

                        {/* Text Alignment */}
                        <div className="space-y-3">
                             <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><RefreshCw size={10} /> Alignment</label>
                             <div className="grid grid-cols-3 gap-2 p-1 bg-secondary/30 rounded-xl border border-border/50">
                                {(['left', 'center', 'right'] as const).map(align => (
                                    <button 
                                        key={align}
                                        onClick={() => updateField(selectedField.id, { alignment: align })}
                                        className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedField.alignment === align ? 'bg-background text-primary shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {align}
                                    </button>
                                ))}
                             </div>
                        </div>

                        {/* Color Picker */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Palette size={10} /> Selection Color</label>
                            <div className="flex flex-wrap gap-2">
                                {['#111827', '#374151', '#4B5563', '#9CA3AF', '#FFFFFF', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'].map(c => (
                                    <button 
                                        key={c}
                                        onClick={() => updateField(selectedField.id, { color: c })}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${selectedField.color === c ? 'border-primary ring-2 ring-primary/20' : 'border-background shadow-lg'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                                <input 
                                    type="color" 
                                    value={selectedField.color}
                                    onChange={(e) => updateField(selectedField.id, { color: e.target.value })}
                                    className="w-8 h-8 bg-transparent border-0 p-0 cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Status Check */}
                        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex gap-3">
                            <AlertCircle className="shrink-0 text-amber-500" size={16} />
                            <p className="text-[10px] font-bold text-amber-600/80 leading-relaxed">
                                Layout is based on percentages. It will remain consistent across different screen sizes and print resolutions.
                            </p>
                        </div>
                    </div>
                )}
            </aside>
        </div>
    );
}
