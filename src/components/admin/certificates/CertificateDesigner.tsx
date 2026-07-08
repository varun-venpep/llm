'use client';

import { useState, useRef } from 'react';
import { Save, ChevronLeft, Type, Move, Palette, Maximize, AlertCircle, Loader2, RefreshCw, Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { uploadFile } from '@/lib/upload';

interface DesignField {
    id: string;
    text: string;
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    fontSize: number;
    color: string;
    fontWeight: string;
    alignment: 'left' | 'center' | 'right';
    type?: 'text' | 'image';
    imageUrl?: string;
    width?: number;
    height?: number;
}

interface Template {
    id: string;
    name: string;
    backgroundImage: string;
    designFields?: { fields?: DesignField[] } | null;
}

interface CertificateDesignerProps {
    template: Template;
    onBack: () => void;
    onSave: (id: string, designFields: { fields: DesignField[] }, backgroundImage: string, name: string) => void | Promise<void>;
}

const DEFAULT_FIELDS: DesignField[] = [
    { id: 'name', text: '{{Learner Name}}', x: 50, y: 45, fontSize: 36, color: '#111827', fontWeight: 'bold', alignment: 'center', type: 'text' },
    { id: 'course', text: '{{Course Title}}', x: 50, y: 58, fontSize: 24, color: '#374151', fontWeight: 'semibold', alignment: 'center', type: 'text' },
    { id: 'date', text: '{{Completion Date}}', x: 50, y: 75, fontSize: 14, color: '#6B7280', fontWeight: 'normal', alignment: 'center', type: 'text' },
    { id: 'serial', text: 'ID: {{Certificate ID}}', x: 50, y: 82, fontSize: 10, color: '#9CA3AF', fontWeight: 'normal', alignment: 'center', type: 'text' },
];

const FALLBACK_BACKGROUND = 'https://images.unsplash.com/photo-1544391682-17fe04257eb0?w=1200&auto=format&fit=crop&q=80';

const PLACEHOLDER_FIELDS = [
    { id: 'name', label: 'Learner Name', text: '{{Learner Name}}' },
    { id: 'course', label: 'Course Title', text: '{{Course Title}}' },
    { id: 'date', label: 'Completion Date', text: '{{Completion Date}}' },
    { id: 'serial', label: 'Certificate ID', text: 'ID: {{Certificate ID}}' },
    { id: 'title', label: 'Certificate Title', text: 'Certificate of Achievement' },
    { id: 'description', label: 'Description Statement', text: 'for successfully completing the training program' },
    { id: 'designation', label: 'Signatory Designation', text: 'Managing Director' },
];

const PRESET_IMAGE_FIELDS = [
    { id: 'logo', label: 'Company Logo', text: 'Company Logo', width: 80, height: 40 },
    { id: 'signature', label: 'Authorized Signature', text: 'Authorized Signature', width: 120, height: 50 },
];

function resolveImageUrl(url: string) {
    if (!url) return FALLBACK_BACKGROUND;
    if (url.startsWith('/')) return url;

    try {
        const parsed = new URL(url);
        if (parsed.hostname.includes('.s3.') || parsed.hostname.includes('.s3-') || parsed.hostname.includes('s3.amazonaws.com')) {
            const bucket = parsed.hostname.split('.')[0];
            const key = parsed.pathname.replace(/^\/+/, '').split('/').map(decodeURIComponent).map(encodeURIComponent).join('/');
            return `/api/files/${key}?bucket=${encodeURIComponent(bucket)}`;
        }
    } catch {
        return url;
    }

    return url;
}

function normalizeFields(rawFields?: DesignField[]) {
    const source = rawFields?.length ? rawFields : DEFAULT_FIELDS;
    const seenIds = new Set<string>();
    const seenSystemTexts = new Set<string>();

    return source.reduce<DesignField[]>((result, field, index) => {
        const isSystemPlaceholder = PLACEHOLDER_FIELDS.some(item => item.text === field.text);
        if (isSystemPlaceholder && seenSystemTexts.has(field.text)) return result;
        if (isSystemPlaceholder) seenSystemTexts.add(field.text);

        const baseId = field.id || `field-${index + 1}`;
        const id = seenIds.has(baseId) ? `${baseId}-${index + 1}` : baseId;
        seenIds.add(id);

        result.push({
            ...field,
            id,
            x: Math.min(Math.max(field.x, 0), 100),
            y: Math.min(Math.max(field.y, 0), 100),
        });
        return result;
    }, []);
}

export default function CertificateDesigner({ template, onBack, onSave }: CertificateDesignerProps) {
    const [fields, setFields] = useState<DesignField[]>(() => normalizeFields(template.designFields?.fields));
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [backgroundImage, setBackgroundImage] = useState(() => resolveImageUrl(template.backgroundImage));
    const [backgroundError, setBackgroundError] = useState(false);
    const [backgroundErrorDetail, setBackgroundErrorDetail] = useState('');
    const [name, setName] = useState(template.name);
    const [saving, setSaving] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const nextFieldIdRef = useRef(0);
    const [uploadingField, setUploadingField] = useState<string | null>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldKey: string, onUrlReady: (url: string) => void) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingField(fieldKey);
        try {
            const data = await uploadFile(file, { tenantId: 'system', courseId: 'certificates' });
            onUrlReady(data.url);
        } catch (err: any) {
            console.error(err);
            alert(err?.message || 'Upload failed');
        } finally {
            setUploadingField(null);
        }
    };

    const selectedField = fields.find(f => f.id === selectedFieldId);
    const existingSystemTexts = new Set(fields.map(field => field.text));

    const updateField = (id: string, updates: Partial<DesignField>) => {
        setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const createFieldId = () => {
        nextFieldIdRef.current += 1;
        let id = `custom-${nextFieldIdRef.current}`;
        while (fields.some(field => field.id === id)) {
            nextFieldIdRef.current += 1;
            id = `custom-${nextFieldIdRef.current}`;
        }
        return id;
    };

    const addField = (text = 'Custom Text', type: 'text' | 'image' = 'text', imageUrl?: string, width?: number, height?: number, fieldId?: string) => {
        const customCount = fields.filter(field => !PLACEHOLDER_FIELDS.some(item => item.text === field.text)).length;
        const nextY = Math.min(88, 40 + customCount * 8);
        const newField: DesignField = {
            id: fieldId || createFieldId(),
            text,
            x: 50,
            y: text.includes('{{') ? 50 : nextY,
            fontSize: text.includes('{{') ? 24 : 18,
            color: '#111827',
            fontWeight: text.includes('{{') ? 'semibold' : 'normal',
            alignment: 'center',
            type,
            imageUrl,
            width,
            height
        };
        setFields(prev => [...prev, newField]);
        setSelectedFieldId(newField.id);
    };

    const deleteField = (id: string) => {
        setFields(prev => prev.filter(f => f.id !== id));
        setSelectedFieldId(null);
    };

    const handleDrag = (e: React.MouseEvent | React.TouchEvent, id: string) => {
        const container = containerRef.current;
        if (!container) return;

        const move = (moveEvent: MouseEvent | TouchEvent) => {
            const rect = container.getBoundingClientRect();
            const isTouch = moveEvent instanceof TouchEvent;
            const clientX = isTouch ? moveEvent.touches[0].clientX : moveEvent.clientX;
            const clientY = isTouch ? moveEvent.touches[0].clientY : moveEvent.clientY;
            
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
        await onSave(template.id, { fields: normalizeFields(fields) }, backgroundImage, name);
        setSaving(false);
    };

    const checkBackground = async (url: string) => {
        const resolvedUrl = resolveImageUrl(url);
        setBackgroundError(false);
        setBackgroundErrorDetail('');

        if (resolvedUrl.startsWith('/api/files/')) {
            try {
                const res = await fetch(resolvedUrl, { method: 'HEAD' });
                if (!res.ok) {
                    const detail = await fetch(resolvedUrl).then(response => response.text()).catch(() => '');
                    setBackgroundError(true);
                    setBackgroundErrorDetail(detail || `Request failed with ${res.status}`);
                }
            } catch {
                setBackgroundError(true);
                setBackgroundErrorDetail('Unable to reach the file proxy route.');
            }
        }
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
                            Editing: <span className="text-primary">{name}</span>
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
                        {backgroundError ? (
                            <div className="w-full h-full bg-secondary/20 border border-dashed border-border flex flex-col items-center justify-center gap-3 text-center px-8">
                                <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-black uppercase tracking-widest">Background not loading</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {backgroundErrorDetail || 'Update the background image URL in the inspector.'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <img
                            src={resolveImageUrl(backgroundImage)}
                                alt="Certificate Background"
                                crossOrigin="anonymous"
                                onError={() => setBackgroundError(true)}
                                className="w-full h-full object-cover select-none pointer-events-none"
                            />
                        )}

                        {/* Overlay Fields */}
                        {!backgroundError && fields.map((field) => (
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
                                    fontSize: field.type === 'image' ? undefined : `${field.fontSize}px`,
                                    color: field.type === 'image' ? undefined : field.color,
                                    fontWeight: field.type === 'image' ? undefined : (field.fontWeight === 'bold' ? '900' : field.fontWeight === 'semibold' ? '700' : '400'),
                                    textAlign: field.type === 'image' ? undefined : field.alignment,
                                    whiteSpace: 'nowrap',
                                    userSelect: 'none',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    border: selectedFieldId === field.id ? '2px solid #3b82f6' : '2px solid transparent',
                                    backgroundColor: selectedFieldId === field.id ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                                }}
                                className="transition-[border,background-color] duration-200"
                            >
                                {field.type === 'image' ? (
                                    field.imageUrl ? (
                                        <img 
                                            src={resolveImageUrl(field.imageUrl)} 
                                            alt={field.text} 
                                            style={{ 
                                                width: field.width ? `${field.width}px` : 'auto', 
                                                height: field.height ? `${field.height}px` : 'auto',
                                                pointerEvents: 'none',
                                                objectFit: 'contain',
                                                display: 'block'
                                            }} 
                                        />
                                    ) : (
                                        <span className="text-xs text-muted-foreground/60 italic font-bold">
                                            [{field.text} - Upload Image]
                                        </span>
                                    )
                                ) : (
                                    field.text
                                )}
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

                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Type size={10} /> Template Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. My Certificate"
                        className="w-full bg-secondary/30 border border-border/50 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <ImageIcon size={10} /> Background Image
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={backgroundImage}
                            onChange={(e) => {
                                setBackgroundImage(e.target.value);
                                setBackgroundError(false);
                                setBackgroundErrorDetail('');
                            }}
                            placeholder="https://..."
                            className="flex-1 bg-secondary/30 border border-border/50 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-0"
                        />
                        <label className="px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-black uppercase cursor-pointer flex items-center gap-1.5 transition-all select-none shrink-0">
                            {uploadingField === 'background' ? (
                                <Loader2 size={12} className="animate-spin" />
                            ) : (
                                <Upload size={12} />
                            )}
                            {uploadingField === 'background' ? '...' : 'Upload'}
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => handleUpload(e, 'background', (url) => {
                                    setBackgroundImage(url);
                                    setBackgroundError(false);
                                    setBackgroundErrorDetail('');
                                })} 
                            />
                        </label>
                    </div>
                    <button
                        onClick={() => checkBackground(backgroundImage)}
                        className="w-full px-3 py-2 rounded-xl bg-secondary/30 border border-border/50 text-[10px] font-black uppercase tracking-widest hover:bg-secondary transition-all"
                    >
                        Check Background
                    </button>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Plus size={10} /> Add Text Field
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {PLACEHOLDER_FIELDS.map(field => {
                            const isExisting = fields.some(f => f.id === field.id);
                            return (
                            <button
                                key={field.text}
                                disabled={isExisting}
                                onClick={() => addField(field.text, 'text', undefined, undefined, undefined, field.id)}
                                className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${isExisting ? 'bg-secondary/10 border-border/30 text-muted-foreground/40 cursor-not-allowed' : 'bg-secondary/30 border-border/50 hover:bg-secondary'}`}
                            >
                                {field.label}
                            </button>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Plus size={10} /> Add Image Field
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {PRESET_IMAGE_FIELDS.map(field => {
                            const isExisting = fields.some(f => f.id === field.id);
                            return (
                            <button
                                key={field.text}
                                disabled={isExisting}
                                onClick={() => addField(field.text, 'image', undefined, field.width, field.height, field.id)}
                                className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${isExisting ? 'bg-secondary/10 border-border/30 text-muted-foreground/40 cursor-not-allowed' : 'bg-secondary/30 border-border/50 hover:bg-secondary'}`}
                            >
                                {field.label}
                            </button>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-2">
                    <button
                        onClick={() => addField('Custom Text', 'text')}
                        className="w-full px-3 py-2 rounded-xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all"
                    >
                        Custom Text
                    </button>
                    <button
                        onClick={() => addField('Custom Image', 'image', undefined, 100, 100)}
                        className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/50 text-[10px] font-black uppercase tracking-widest hover:bg-secondary transition-all"
                    >
                        Custom Image
                    </button>
                    <button
                        onClick={() => {
                            setFields(DEFAULT_FIELDS);
                            setSelectedFieldId(null);
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-secondary/30 border border-border/50 text-[10px] font-black uppercase tracking-widest hover:bg-secondary transition-all"
                    >
                        Reset Default Fields
                    </button>
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
                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Target Field</p>
                                <p className="font-bold text-sm tracking-tight">{selectedField.text}</p>
                            </div>
                            <button
                                onClick={() => deleteField(selectedField.id)}
                                className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-400"
                            >
                                <Trash2 size={11} /> Delete
                            </button>
                        </div>

                        {/* Text Fields: Content */}
                        {selectedField.type !== 'image' && (
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Type size={10} /> Text</label>
                                <textarea
                                    value={selectedField.text}
                                    onChange={(e) => updateField(selectedField.id, { text: e.target.value })}
                                    rows={3}
                                    className="w-full bg-secondary/30 border border-border/50 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                />
                                <p className="text-[10px] text-muted-foreground font-bold leading-relaxed">
                                    Dynamic values use placeholders like {'{{Learner Name}}'} and {'{{Course Title}}'}.
                                </p>
                            </div>
                        )}

                        {/* Image Fields: Custom Image properties */}
                        {selectedField.type === 'image' && (
                            <>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <Type size={10} /> Field Label
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedField.text}
                                        onChange={(e) => updateField(selectedField.id, { text: e.target.value })}
                                        className="w-full bg-secondary/30 border border-border/50 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                        <ImageIcon size={10} /> Image Resource
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={selectedField.imageUrl || ''}
                                            onChange={(e) => updateField(selectedField.id, { imageUrl: e.target.value })}
                                            placeholder="https://..."
                                            className="flex-1 bg-secondary/30 border border-border/50 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-0"
                                        />
                                        <label className="px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-black uppercase cursor-pointer flex items-center gap-1.5 transition-all select-none shrink-0">
                                            {uploadingField === selectedField.id ? (
                                                <Loader2 size={12} className="animate-spin" />
                                            ) : (
                                                <Upload size={12} />
                                            )}
                                            {uploadingField === selectedField.id ? '...' : 'Upload'}
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                className="hidden" 
                                                onChange={(e) => handleUpload(e, selectedField.id, (url) => {
                                                    updateField(selectedField.id, { imageUrl: url });
                                                })} 
                                            />
                                        </label>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Width (px)</label>
                                        <input
                                            type="number"
                                            value={selectedField.width || 80}
                                            onChange={(e) => updateField(selectedField.id, { width: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-secondary/30 border border-border/50 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Height (px)</label>
                                        <input
                                            type="number"
                                            value={selectedField.height || 40}
                                            onChange={(e) => updateField(selectedField.id, { height: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-secondary/30 border border-border/50 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Text Fields: Font Size */}
                        {selectedField.type !== 'image' && (
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
                        )}

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

                        {/* Text Fields: Color Picker */}
                        {selectedField.type !== 'image' && (
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
                        )}

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
