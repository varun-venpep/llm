'use client';

import { useState, useEffect } from 'react';
import { Award, Plus, Upload, Trash2, Loader2, Image as ImageIcon, Search } from 'lucide-react';

interface Template {
    id: string;
    name: string;
    backgroundImage: string;
    createdAt: string;
}

export default function SuperAdminCertificates() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUpload, setShowUpload] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [newTemplate, setNewTemplate] = useState({ name: '', image: '' });
    const [search, setSearch] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await fetch('/api/admin/certificates');
            const data = await res.json();
            setTemplates(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                setNewTemplate(prev => ({ ...prev, image: data.url }));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setUploading(false);
        }
    };

    const createTemplate = async () => {
        if (!newTemplate.name || !newTemplate.image) return;
        setUploading(true);
        try {
            const res = await fetch('/api/admin/certificates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newTemplate.name,
                    backgroundImage: newTemplate.image
                })
            });
            if (res.ok) {
                fetchTemplates();
                setShowUpload(false);
                setNewTemplate({ name: '', image: '' });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setUploading(false);
        }
    };

    const deleteTemplate = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/certificates?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchTemplates();
                setDeletingId(null);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const filteredTemplates = templates.filter(t => 
        t.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black tracking-tight uppercase flex items-center gap-3">
                        <Award className="w-8 h-8 text-indigo-500" /> Global Certificate Library
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage standard certificate backgrounds available for all platform tenants.</p>
                </div>
                <button
                    onClick={() => setShowUpload(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-all hover:scale-105 shadow-xl shadow-indigo-500/20"
                >
                    <Plus className="w-5 h-5" /> Add Global Template
                </button>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                    type="text" 
                    placeholder="Search templates..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-secondary/50 border border-border/50 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-500/50" />
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Syncing Library...</p>
                </div>
            ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-32 border-2 border-dashed border-border/50 rounded-[2.5rem] bg-secondary/5">
                    <Award className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <p className="font-bold text-lg">No templates found</p>
                    <p className="text-muted-foreground text-sm">Upload a global template background to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredTemplates.map((template) => (
                        <div key={template.id} className="group glassmorphism rounded-[2.5rem] border border-border/50 overflow-hidden hover:border-indigo-500/30 transition-all shadow-2xl relative">
                            <div className="aspect-[1.414/1] bg-secondary/20 relative overflow-hidden flex items-center justify-center">
                                <img src={template.backgroundImage} alt={template.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <button className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform">
                                        <ImageIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-lg tracking-tight uppercase">{template.name}</h3>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Added on {new Date(template.createdAt).toLocaleDateString()}</p>
                                </div>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (deletingId === template.id) { deleteTemplate(template.id); }
                                        else { setDeletingId(template.id); setTimeout(() => setDeletingId(null), 3000); }
                                    }}
                                    className={`p-2.5 rounded-xl transition-all flex items-center gap-2 ${deletingId === template.id ? 'bg-red-500 text-white px-4 scale-110 shadow-lg' : 'hover:bg-red-500/10 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100'}`}
                                >
                                    {deletingId === template.id ? <span className="text-[10px] font-black uppercase tracking-widest">Confirm?</span> : <Trash2 className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Modal */}
            {showUpload && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-background border border-border w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 space-y-8">
                        <div className="text-center space-y-2">
                            <h3 className="text-2xl font-black uppercase tracking-tight">New Global Template</h3>
                            <p className="text-sm text-muted-foreground">Upload a background for the certificate library.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Template Name</label>
                                <input 
                                    type="text"
                                    placeholder="e.g. Modern Achievement"
                                    value={newTemplate.name}
                                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full bg-secondary/50 border border-border/50 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Background Image</label>
                                <label className="flex flex-col items-center justify-center aspect-[1.414/1] bg-secondary/30 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:bg-secondary/50 p-6 transition-all group overflow-hidden">
                                    {newTemplate.image ? (
                                        <img src={newTemplate.image} className="w-full h-full object-cover rounded-lg" alt="Preview" />
                                    ) : (
                                        <>
                                            {uploading ? <Loader2 className="w-8 h-8 animate-spin text-indigo-500" /> : <Upload className="w-8 h-8 text-muted-foreground group-hover:text-indigo-400 transition-colors" />}
                                            <div className="text-center mt-3 group-hover:text-indigo-300 transition-colors">
                                                <p className="text-xs font-bold text-muted-foreground">Click to upload template</p>
                                                <p className="text-[10px] font-black uppercase text-indigo-500/50 mt-1 tracking-tighter">Recommended: 2480 x 3508 px (A4 Landscape)</p>
                                            </div>
                                            <p className="text-[9px] text-muted-foreground/60 mt-1 uppercase tracking-tighter">JPG, PNG strictly landscape preferred</p>
                                        </>
                                    )}
                                    <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={() => setShowUpload(false)}
                                className="flex-1 py-4 bg-secondary text-muted-foreground font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-secondary/80 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={createTemplate}
                                disabled={!newTemplate.name || !newTemplate.image || uploading}
                                className="flex-1 py-4 bg-indigo-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-xl shadow-indigo-500/20"
                            >
                                {uploading ? 'Processing...' : 'Add Template'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
