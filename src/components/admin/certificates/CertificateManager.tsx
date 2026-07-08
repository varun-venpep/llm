'use client';

import { useState, useEffect } from 'react';
import { Award, Plus, Trash2, Loader2, Edit3, Copy, Globe, User, Search, Grid, List as ListIcon } from 'lucide-react';

interface Template {
    id: string;
    name: string;
    backgroundImage: string;
    isGlobal: boolean;
    designFields?: any;
    createdAt?: string;
}

interface CertificateManagerProps {
    domain: string;
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    onEditTemplate: (template: Template) => void;
    askConfirmation?: (title: string, message: string, variant?: 'danger' | 'info') => Promise<boolean>;
}

export default function CertificateManager({ domain, addToast, onEditTemplate, askConfirmation }: CertificateManagerProps) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await fetch(`/api/t/${domain}/certificates`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setTemplates(data);
            } else {
                console.error('API Error: Expected array but received', data);
                setTemplates([]);
                if (data.error) {
                    addToast(data.error, 'error');
                }
            }
        } catch (e) {
            console.error(e);
            addToast('Failed to sync certificate library.', 'error');
            setTemplates([]);
        } finally {
            setLoading(false);
        }
    };

    const duplicateTemplate = async (template: Template, shouldEdit: boolean = true) => {
        try {
            const isBlank = !template.id;
            const res = await fetch(`/api/t/${domain}/certificates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: isBlank ? template.name : `${template.name} (Copy)`,
                    backgroundImage: template.backgroundImage,
                    isDuplicateOf: template.id || undefined
                })
            });
            const newT = await res.json();
            if (res.ok) {
                setTemplates(prev => [newT, ...(Array.isArray(prev) ? prev : [])]);
                addToast(isBlank ? 'Blank template created.' : 'Template duplicated to your local library.', 'success');
                if (shouldEdit) {
                    onEditTemplate(newT);
                }
            } else {
                addToast(newT.error || 'Failed to duplicate template.', 'error');
            }
        } catch (e) {
            console.error(e);
            addToast('Network error while duplicating template.', 'error');
        }
    };

    const createBlankTemplate = () => {
        onEditTemplate({
            id: 'new',
            name: 'New Custom Template',
            backgroundImage: '',
            isGlobal: false,
            designFields: { fields: [] }
        });
    };

    const deleteTemplate = async (id: string) => {
        const confirmed = askConfirmation
            ? await askConfirmation('Delete Template?', 'Are you sure you want to delete this local template?')
            : confirm('Are you sure you want to delete this local template?');
        if (!confirmed) return;
        try {
            const res = await fetch(`/api/t/${domain}/certificates/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setTemplates(prev => (Array.isArray(prev) ? prev : []).filter(t => t.id !== id));
                addToast('Template removed.', 'success');
            } else {
                const data = await res.json();
                addToast(data.error || 'Failed to delete template.', 'error');
            }
        } catch (e) {
            console.error(e);
            addToast('Network error while deleting template.', 'error');
        }
    };

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase())
    );

    const localTemplates = filteredTemplates.filter(t => !t.isGlobal);
    const globalTemplates = filteredTemplates.filter(t => t.isGlobal);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="relative w-full md:w-96 flex-shrink-0">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search our certificate library..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-secondary/40 border border-border/50 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex p-1 bg-secondary/30 rounded-xl border border-border/50">
                        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-background text-primary shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}><Grid size={16} /></button>
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-background text-primary shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}><ListIcon size={16} /></button>
                    </div>
                    <button
                        onClick={createBlankTemplate}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] rounded-2xl hover:scale-105 transition-all shadow-xl shadow-primary/20"
                    >
                        <Plus size={14} /> Create Blank
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary/50" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Synchronizing Global Assets...</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {/* Local Templates */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 ml-2">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Custom Templates</h2>
                        </div>

                        {localTemplates.length === 0 ? (
                            <div className="p-12 text-center border-2 border-dashed border-border/30 rounded-[2.5rem] bg-secondary/5">
                                <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                                <p className="font-bold text-muted-foreground">No custom templates yet.</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">Duplicate a global template or create one from scratch.</p>
                            </div>
                        ) : (
                            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8" : "space-y-4"}>
                                {localTemplates.map(t => (
                                    <TemplateCard key={t.id} template={t} mode={viewMode} onDelete={deleteTemplate} onEdit={onEditTemplate} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Global Templates */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 ml-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Global Template Library</h2>
                        </div>

                        {globalTemplates.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground italic text-sm">No global templates available.</div>
                        ) : (
                            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8" : "space-y-4"}>
                                {globalTemplates.map(t => (
                                    <TemplateCard key={t.id} template={t} mode={viewMode} onDuplicate={duplicateTemplate} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function TemplateCard({ template, mode, onDelete, onEdit, onDuplicate }: {
    template: Template,
    mode: 'grid' | 'list',
    onDelete?: (id: string) => void,
    onEdit?: (t: Template) => void,
    onDuplicate?: (t: Template) => void
}) {
    if (mode === 'list') {
        return (
            <div className="flex items-center gap-6 p-4 glassmorphism rounded-[1.5rem] border border-border/50 hover:border-primary/30 transition-all group">
                <div className="w-24 aspect-[1.414/1] bg-secondary/30 rounded-xl overflow-hidden flex-shrink-0">
                    <img
                        src={template.backgroundImage || '/placeholder-cert.svg'}
                        alt={template.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-cert.svg'; }}
                    />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-sm tracking-tight uppercase">{template.name}</h3>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{template.isGlobal ? 'Global Asset' : 'Organization Custom'}</p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!template.isGlobal ? (
                        <>
                            <button onClick={() => onEdit?.(template)} className="p-2.5 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all"><Edit3 size={16} /></button>
                            <button onClick={() => onDelete?.(template.id)} className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16} /></button>
                        </>
                    ) : (
                        <button onClick={() => onDuplicate?.(template)} className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                            <Copy size={16} /> Clone to Local
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="group glassmorphism rounded-[2.5rem] border border-border/50 overflow-hidden hover:border-primary/30 transition-all shadow-2xl relative">
            <div className="aspect-[1.414/1] bg-secondary/20 relative overflow-hidden flex items-center justify-center border-b border-border/50">
                <img
                    src={template.backgroundImage || '/placeholder-cert.svg'}
                    alt={template.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-cert.svg'; }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
                    {!template.isGlobal ? (
                        <button onClick={() => onEdit?.(template)} className="px-6 py-2.5 bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] rounded-2xl hover:scale-110 transition-all shadow-xl shadow-primary/20 flex items-center gap-2">
                            <Edit3 size={16} /> Modify Design
                        </button>
                    ) : (
                        <button onClick={() => onDuplicate?.(template)} className="px-6 py-2.5 bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:scale-110 transition-all shadow-xl shadow-indigo-500/20 flex items-center gap-2">
                            <Copy size={16} /> Use This Template
                        </button>
                    )}
                </div>
                <div className="absolute top-4 left-4">
                    <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border backdrop-blur-md ${template.isGlobal ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-primary/20 border-primary/30 text-primary'}`}>
                        {template.isGlobal ? <Globe className="w-3 h-3 inline mr-1" /> : <User className="w-3 h-3 inline mr-1" />}
                        {template.isGlobal ? 'Global' : 'Custom'}
                    </span>
                </div>
            </div>
            <div className="p-6 flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-lg tracking-tight uppercase leading-none mb-1.5">{template.name}</h3>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{template.createdAt ? new Date(template.createdAt).toLocaleDateString() : 'N/A'}</p>
                </div>
                {!template.isGlobal && (
                    <button onClick={() => onDelete?.(template.id)} className="p-2.5 rounded-xl hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 size={18} />
                    </button>
                )}
            </div>
        </div>
    );
}
