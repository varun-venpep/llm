'use client';

import { useState, useEffect, useRef } from 'react';
import { Save, ChevronLeft, Type, Move, Palette, Maximize, AlertCircle, Loader2, RefreshCw, Image as ImageIcon, Check, Globe, Layout, AlignLeft, AlignCenter, AlignRight, Upload, X } from 'lucide-react';
import { useParams } from 'next/navigation';

interface DesignField {
    id: string;
    type: 'text' | 'image';
    text: string; // Used for content if text, label if image
    content?: string; // Image URL if type is image
    x: number;
    y: number;
    fontSize: number;
    width?: number; // Only for images
    color: string;
    fontWeight: 'normal' | 'semibold' | 'bold';
    fontFamily: 'serif' | 'sans' | 'monospace' | 'playfair' | 'inter';
    alignment: 'left' | 'center' | 'right';
    textTransform?: 'none' | 'uppercase';
}

interface Template {
    id: string;
    name: string;
    backgroundImage: string;
    designFields?: any;
    isGlobal?: boolean;
}

interface CertificateDesignerProps {
    template: Template;
    onBack: () => void;
    onSave: (id: string, designFields: any, backgroundImage: string) => void;
}

// 2480x3508px (A4 Landscape) is the recommended high-res print specification
const RECOMMENDED_RATIO = 1.414;
const RECOMMENDED_RESOLUTION = "2480 x 3508 px (A4 Landscape)";

const FONTS = [
    { id: 'inter', name: 'Inter (Sans)', value: 'Inter, system-ui, sans-serif' },
    { id: 'serif', name: 'Classic Serif', value: 'Georgia, serif' },
    { id: 'monospace', name: 'Technical Mono', value: 'monospace' },
    { id: 'playfair', name: 'Playfair Display', value: '"Playfair Display", serif' },
];

const DEFAULT_FIELDS: DesignField[] = [
    { id: 'name', type: 'text', text: '{{Learner Name}}', x: 50, y: 45, fontSize: 36, color: '#111827', fontWeight: 'bold', fontFamily: 'serif', alignment: 'center', textTransform: 'none' },
    { id: 'course', type: 'text', text: '{{Course Title}}', x: 50, y: 58, fontSize: 24, color: '#374151', fontWeight: 'semibold', fontFamily: 'inter', alignment: 'center', textTransform: 'uppercase' },
    { id: 'date', type: 'text', text: '{{Completion Date}}', x: 50, y: 75, fontSize: 14, color: '#6B7280', fontWeight: 'normal', fontFamily: 'inter', alignment: 'center', textTransform: 'none' },
    { id: 'serial', type: 'text', text: 'ID: {{Certificate ID}}', x: 50, y: 82, fontSize: 10, color: '#9CA3AF', fontWeight: 'normal', fontFamily: 'monospace', alignment: 'center', textTransform: 'none' },
];

function BackgroundLibraryModal({ onSelect, onClose, domain }: { onSelect: (url: string) => void, onClose: () => void, domain: string }) {
    const [globalTemplates, setGlobalTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGlobalTemplates = async () => {
            try {
                const res = await fetch(`/api/t/${domain}/certificates`);
                const data = await res.json();
                setGlobalTemplates(data.filter((t: any) => t.isGlobal));
            } catch (e) {
                console.error("Failed to fetch global backgrounds:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchGlobalTemplates();
    }, [domain]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-background border border-border w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
                <div className="p-8 border-b border-border flex justify-between items-center bg-secondary/10">
                    <div>
                        <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                            <ImageIcon className="w-8 h-8 text-indigo-500" /> Global Background Library
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 uppercase font-bold tracking-widest text-center">Super Admin Curated Assets Only</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-secondary rounded-2xl transition-all"><X size={20} /></button>
                </div>

                <div className="p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-4">
                            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse text-center leading-none">Syncing Assets...</p>
                        </div>
                    ) : globalTemplates.length === 0 ? (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-border/50 rounded-3xl bg-secondary/5">
                            <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                            <p className="font-bold text-lg uppercase tracking-tight">Library Empty</p>
                            <p className="text-muted-foreground text-sm">No global templates available yet.</p>
                        </div>
                    ) : (
                        globalTemplates.map(template => (
                            <div 
                                key={template.id} 
                                onClick={() => onSelect(template.backgroundImage)}
                                className="group cursor-pointer space-y-3"
                            >
                                <div className="aspect-[1.414/1] bg-secondary/30 rounded-[2rem] overflow-hidden border border-border/50 group-hover:border-indigo-500/50 transition-all shadow-lg relative">
                                    <img 
                                        src={template.backgroundImage} 
                                        alt={template.name} 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="px-5 py-2 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-full scale-90 group-hover:scale-110 transition-transform shadow-xl">Use Template</div>
                                    </div>
                                </div>
                                <div className="px-2">
                                    <h4 className="font-black text-xs uppercase tracking-tight truncate">{template.name}</h4>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default function CertificateDesigner({ template: initialTemplate, onBack, onSave }: CertificateDesignerProps) {
    const [fields, setFields] = useState<DesignField[]>(initialTemplate.designFields?.fields || DEFAULT_FIELDS);
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [backgroundImage, setBackgroundImage] = useState(initialTemplate.backgroundImage);
    const [saving, setSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showLibrary, setShowLibrary] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleAddField = (type: 'text' | 'image', label: string) => {
        const id = `${type}-${Date.now()}`;
        const newField: DesignField = type === 'text' ? {
            id, type: 'text', text: `{{${label}}}`, x: 50, y: 50, fontSize: 18, width: 400, color: '#111827', fontWeight: 'normal', fontFamily: 'inter', alignment: 'center'
        } : {
            id, type: 'image', text: label, content: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?w=200&q=80', x: 50, y: 50, width: 120, fontSize: 0, color: '', fontWeight: 'normal', fontFamily: 'inter', alignment: 'center'
        };
        setFields(prev => [...prev, newField]);
        setSelectedFieldId(id);
    };

    const deleteField = (id: string) => {
        setFields(prev => prev.filter(f => f.id !== id));
        setSelectedFieldId(null);
    };

    const params = useParams();
    const domain = params.domain as string;
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
        await onSave(initialTemplate.id, { fields }, backgroundImage);
        setSaving(false);
    };

    return (
        <div className="flex flex-col lg:flex-row h-full gap-8 animate-in slide-in-from-right-4 duration-500 overflow-hidden min-h-[700px]">
            {/* Google Fonts Link */}
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Playfair+Display:wght@400;700;900&display=swap" rel="stylesheet" />

            {/* Main Designer Area */}
            <div className="flex-1 flex flex-col gap-4 min-h-0">
                <div className="flex items-center justify-between">
                    <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronLeft size={16} /> Back to Library
                    </button>
                    <div className="flex items-center gap-3">
                         <span className="text-xs font-bold text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full border border-border/50">
                            Editing: <span className="text-primary">{initialTemplate.name}</span>
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
                            src={backgroundImage || 'https://images.unsplash.com/photo-1544391682-17fe04257eb0?w=1200&auto=format&fit=crop&q=80'} 
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
                                    fontFamily: FONTS.find(f => f.id === field.fontFamily)?.value || 'sans-serif',
                                    fontWeight: field.fontWeight === 'bold' ? '900' : field.fontWeight === 'semibold' ? '700' : '400',
                                    textAlign: field.alignment,
                                    textTransform: field.textTransform || 'none',
                                    whiteSpace: 'pre-wrap',
                                    width: field.width ? `${field.width}px` : 'auto',
                                    wordBreak: 'break-word',
                                    userSelect: 'none',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    border: selectedFieldId === field.id ? '2px solid #3b82f6' : '1px dotted rgba(59, 130, 246, 0.2)',
                                    backgroundColor: selectedFieldId === field.id ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                                    zIndex: selectedFieldId === field.id ? 20 : 10
                                }}
                                className="transition-[border,background-color] duration-200"
                            >
                                {field.type === 'text' ? (
                                    field.text
                                ) : (
                                    <img 
                                        src={field.content} 
                                        alt={field.text} 
                                        style={{ width: `${field.width}px`, height: 'auto', display: 'block' }}
                                        className="transition-all"
                                    />
                                )}
                                {selectedFieldId === field.id && (
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-blue-600 text-white text-[8px] font-black uppercase rounded shadow-lg">
                                        Inspector Active
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
                    <div className="space-y-6">
                        <div className="p-8 border-2 border-dashed border-border/50 rounded-3xl flex flex-col items-center justify-center text-center space-y-3 bg-secondary/5">
                            <div className="w-12 h-12 rounded-full bg-secondary/30 flex items-center justify-center text-muted-foreground">
                                <Layout size={20} />
                            </div>
                            <p className="text-sm font-bold text-muted-foreground">Select a field on the canvas to edit its properties.</p>
                        </div>
                        
                        {/* Global Settings (When no field selected) */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Globe size={10} /> Global Template Assets
                            </label>
                            {/* Custom Upload Option */}
                            <div className="space-y-3">
                                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border/50 rounded-3xl hover:bg-secondary/30 transition-all cursor-pointer group bg-secondary/10 shadow-sm hover:shadow-md">
                                    {isUploading ? (
                                        <>
                                            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse text-center leading-none">Uploading Asset...</p>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-8 h-8 text-indigo-500/50 group-hover:text-indigo-500 transition-colors mb-2.5" />
                                            <div className="text-center">
                                                <p className="text-[11px] font-black uppercase tracking-tight">Swap Canvas Background</p>
                                                <p className="text-[9px] font-bold text-muted-foreground mt-1 uppercase tracking-tighter opacity-70">Recommended: {RECOMMENDED_RESOLUTION}</p>
                                            </div>
                                        </>
                                    )}
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            
                                            setIsUploading(true);
                                            const formData = new FormData();
                                            formData.append('file', file);

                                            try {
                                                const res = await fetch('/api/upload', {
                                                    method: 'POST',
                                                    body: formData
                                                });
                                                const data = await res.json();
                                                if (data.success) {
                                                    setBackgroundImage(data.url);
                                                }
                                            } catch (err) {
                                                console.error("Upload failed:", err);
                                            } finally {
                                                setIsUploading(false);
                                            }
                                        }}
                                    />
                                </label>
                                <div className="flex items-center gap-3 px-1">
                                    <div className="h-px flex-1 bg-border/30"></div>
                                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest text-center">Library Assets</span>
                                    <div className="h-px flex-1 bg-border/30"></div>
                                </div>
                            </div>

                            <button 
                                onClick={() => setShowLibrary(true)}
                                className="group flex items-center gap-4 p-4 rounded-3xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 hover:border-primary/30 transition-all w-full text-left"
                            >
                                <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center text-primary group-hover:scale-110 transition-transform overflow-hidden">
                                     <img src={backgroundImage} className="w-full h-full object-cover opacity-50" alt="Current" />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-black uppercase tracking-tight">Open Library</p>
                                    <p className="text-[10px] font-bold text-muted-foreground">Super Admin Assets</p>
                                </div>
                            </button>

                            <div className="pt-6 border-t border-border/30">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-4 px-1">New Elements</label>
                                <div className="flex flex-col gap-2">
                                     <button onClick={() => handleAddField('text', 'Custom Label')} className="w-full flex items-center gap-3 p-3 rounded-2xl bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 transition-all hover:translate-x-1 group">
                                         <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors"><Type size={16} /></div>
                                         <span className="text-[11px] font-black uppercase tracking-tight">Add Dynamic Text</span>
                                     </button>
                                     <button onClick={() => handleAddField('image', 'Company Logo')} className="w-full flex items-center gap-3 p-3 rounded-2xl bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 text-amber-500 transition-all hover:translate-x-1 group">
                                         <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors"><ImageIcon size={16} /></div>
                                         <span className="text-[11px] font-black uppercase tracking-tight">Insert Brand Logo</span>
                                     </button>
                                     <button onClick={() => handleAddField('image', 'Official Signature')} className="w-full flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 transition-all hover:translate-x-1 group">
                                         <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors"><Move size={16} /></div>
                                         <span className="text-[11px] font-black uppercase tracking-tight">Insert Signature</span>
                                     </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 pb-20">
                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Target Field</p>
                                <p className="font-bold text-sm tracking-tight">{selectedField.text}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => deleteField(selectedField.id)}
                                    className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                    title="Delete Element"
                                >
                                    <X size={14} />
                                </button>
                                <button onClick={() => setSelectedFieldId(null)} className="p-2 px-3 rounded-lg bg-secondary/50 text-[10px] font-black uppercase hover:bg-secondary transition-all">Deselect</button>
                            </div>
                        </div>

                        {/* Delete Field Option */}
                        <div className="pt-6 mt-6 border-t border-red-500/10">
                            <button 
                                onClick={() => deleteField(selectedField.id)}
                                className="w-full py-4 rounded-2xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                            >
                                <X size={14} /> Remove Element Permanently
                            </button>
                        </div>

                        {/* Image Specific: Resizing & Swapping */}
                        {selectedField.type === 'image' && (
                            <div className="space-y-6 pt-6 border-t border-border/30">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center px-1">
                                         <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Component Width</label>
                                         <span className="text-xs font-bold text-primary">{selectedField.width}px</span>
                                    </div>
                                    <input 
                                        type="range" min="20" max="600" 
                                        value={selectedField.width}
                                        onChange={(e) => updateField(selectedField.id, { width: parseInt(e.target.value) })}
                                        className="w-full accent-primary h-1.5 rounded-full"
                                    />
                                </div>
                                
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">Swap Image Asset</label>
                                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border/50 rounded-[2rem] hover:bg-secondary/20 cursor-pointer overflow-hidden relative group aspect-[2/1]">
                                        <img src={selectedField.content} className="absolute inset-0 w-full h-full object-contain p-4 opacity-40 group-hover:opacity-20 transition-opacity" />
                                        <div className="relative flex flex-col items-center gap-2 group-hover:scale-110 transition-transform">
                                            <Upload className="text-indigo-500" />
                                            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500">Upload New File</p>
                                        </div>
                                        <input type="file" className="hidden" onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            const formData = new FormData();
                                            formData.append('file', file);
                                            try {
                                                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                                                const data = await res.json();
                                                if (data.success) updateField(selectedField.id, { content: data.url });
                                            } catch (e) { console.error(e); }
                                        }} />
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Text Styling (Only for text fields) */}
                        {selectedField.type === 'text' && (
                            <>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Maximize size={10} /> Font Size</label>
                                        <span className="font-mono text-xs font-bold bg-secondary/50 px-2 py-0.5 rounded">{selectedField.fontSize}px</span>
                                    </div>
                                    <input 
                                        type="range" min="8" max="120" 
                                        value={selectedField.fontSize}
                                        onChange={(e) => updateField(selectedField.id, { fontSize: parseInt(e.target.value) })}
                                        className="w-full accent-primary h-1.5 rounded-full"
                                    />
                                </div>

                                {/* Text Box Width Control */}
                                <div className="space-y-3 pt-4 border-t border-border/20">
                                    <div className="flex justify-between items-center px-1">
                                         <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Text Box Width</label>
                                         <span className="text-xs font-bold text-primary">{selectedField.width || 400}px</span>
                                    </div>
                                    <input 
                                        type="range" min="50" max="1200" 
                                        value={selectedField.width || 400}
                                        onChange={(e) => updateField(selectedField.id, { width: parseInt(e.target.value) })}
                                        className="w-full accent-primary h-1.5 rounded-full"
                                    />
                                </div>

                                {/* Typography Family */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1"><Type size={10} /> Typography Family</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {FONTS.map(f => (
                                            <button 
                                                key={f.id}
                                                onClick={() => updateField(selectedField.id, { fontFamily: f.id as any })}
                                                className={`p-3 rounded-xl border text-[10px] font-bold text-left transition-all ${selectedField.fontFamily === f.id ? 'bg-primary text-primary-foreground border-primary shadow-lg' : 'bg-secondary/20 border-border/50 text-muted-foreground hover:bg-secondary/40'}`}
                                                style={{ fontFamily: f.value }}
                                            >
                                                {f.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Text Transformation, Alignment & Color */}
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/20">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1"><RefreshCw size={10} /> Alignment</label>
                                        <div className="grid grid-cols-3 gap-1 p-1 bg-secondary/30 rounded-xl border border-border/50">
                                            {(['left', 'center', 'right'] as const).map(align => {
                                                const Icon = align === 'left' ? AlignLeft : align === 'center' ? AlignCenter : AlignRight;
                                                return (
                                                    <button 
                                                        key={align}
                                                        onClick={() => updateField(selectedField.id, { alignment: align })}
                                                        className={`py-2 rounded-lg flex items-center justify-center transition-all ${selectedField.alignment === align ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                                    >
                                                        <Icon size={12} />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1"><Type size={10} /> Case</label>
                                        <div className="flex gap-1 p-1 bg-secondary/30 rounded-xl border border-border/50">
                                            {(['none', 'uppercase'] as const).map(style => (
                                                <button 
                                                    key={style}
                                                    onClick={() => updateField(selectedField.id, { textTransform: style })}
                                                    className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase transition-all ${selectedField.textTransform === style ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}
                                                >
                                                    {style === 'none' ? 'Abc' : 'ABC'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-border/20">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1"><Palette size={10} /> Color Palette</label>
                                    <div className="flex flex-wrap gap-2 p-3 bg-secondary/20 rounded-2xl border border-border/50">
                                        {['#111827', '#374151', '#4B5563', '#FFFFFF', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'].map(c => (
                                            <button 
                                                key={c}
                                                onClick={() => updateField(selectedField.id, { color: c })}
                                                className={`w-6 h-6 rounded-full border transition-transform hover:scale-110 flex items-center justify-center ${selectedField.color === c ? 'border-primary ring-2 ring-primary/20 shadow-lg' : 'border-transparent'}`}
                                                style={{ backgroundColor: c }}
                                            >
                                                {selectedField.color === c && <Check size={10} className={c === '#FFFFFF' ? 'text-black' : 'text-white'} />}
                                            </button>
                                        ))}
                                        <div className="relative w-6 h-6 rounded-full overflow-hidden border border-border/50 shadow-sm transition-transform hover:scale-110">
                                            <input 
                                                type="color" 
                                                value={selectedField.color}
                                                onChange={(e) => updateField(selectedField.id, { color: e.target.value })}
                                                className="absolute -inset-2 w-10 h-10 cursor-pointer bg-transparent border-0"
                                            />
                                            <Palette size={10} className="absolute inset-0 m-auto pointer-events-none text-muted-foreground mix-blend-difference" />
                                        </div>
                                    </div>
                                </div>

                                {/* Content Editor & Variable Tags */}
                                <div className="space-y-4 pt-4 border-t border-border/20">
                                     <div className="flex justify-between items-center px-1">
                                         <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Content Editor</label>
                                         <span className="text-[9px] font-bold text-indigo-500/80 uppercase tracking-tighter">Use Tags to Dynamicize</span>
                                     </div>

                                     {/* Variable Tags Quick-Insert */}
                                     <div className="flex flex-wrap gap-1.5 p-2 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                                         {[
                                             { label: 'Learner', tag: '{{Learner Name}}' },
                                             { label: 'Course', tag: '{{Course Title}}' },
                                             { label: 'Date', tag: '{{Completion Date}}' },
                                             { label: 'Cert ID', tag: '{{Certificate ID}}' }
                                         ].map(item => (
                                             <button 
                                                key={item.tag}
                                                onClick={() => updateField(selectedField.id, { text: selectedField.text + ' ' + item.tag })}
                                                className="px-2.5 py-1.5 rounded-lg bg-background border border-border/50 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-[9px] font-black uppercase tracking-tight text-muted-foreground hover:text-indigo-600 shadow-sm"
                                             >
                                                 + {item.label}
                                             </button>
                                         ))}
                                     </div>

                                     <textarea 
                                        className="w-full bg-secondary/20 border border-border/50 rounded-2xl p-4 text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-primary/50"
                                        rows={4}
                                        placeholder="Enter certificate text here..."
                                        value={selectedField.text}
                                        onChange={(e) => updateField(selectedField.id, { text: e.target.value })}
                                     />
                                     <p className="text-[9px] text-muted-foreground px-1 italic">Tags will be replaced with real data during certificate generation.</p>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </aside>

            {/* Global Library Modal */}
            {showLibrary && (
                <BackgroundLibraryModal 
                    domain={domain}
                    onSelect={(url) => { 
                        setBackgroundImage(url); 
                        setShowLibrary(false); 
                    }} 
                    onClose={() => setShowLibrary(false)} 
                />
            )}
        </div>
    );
}
