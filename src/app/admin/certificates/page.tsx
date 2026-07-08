'use client';

import { useState, useEffect } from 'react';
import { Award, Plus, Upload, Trash2, Loader2, Image as ImageIcon, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import { uploadFile } from '@/lib/upload';

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
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        image: '', 
        logo: '',
        title: 'Certificate of Achievement',
        description: 'for successfully completing the training program',
        designation: 'Managing Director',
        signature: ''
    });
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await fetch('/api/admin/certificates');
            const data = await res.json();
            setTemplates(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'image' | 'logo' | 'signature') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const data = await uploadFile(file, { tenantId: 'system', courseId: 'certificates' });
            setNewTemplate(prev => ({ ...prev, [field]: data.url }));
        } catch (err: any) {
            console.error(err);
            Swal.fire('Upload Error', err?.message || 'Upload failed', 'error');
        } finally {
            setUploading(false);
        }
    };

    const createTemplate = async () => {
        if (!newTemplate.name || !newTemplate.image) return;

        const designFieldsObj = {
            fields: [
                { id: 'logo', text: 'Company Logo', x: 50, y: 12, fontSize: 12, color: '#111827', fontWeight: 'normal', alignment: 'center', type: 'image', imageUrl: newTemplate.logo, width: 80, height: 40 },
                { id: 'title', text: newTemplate.title || 'Certificate of Achievement', x: 50, y: 25, fontSize: 32, color: '#111827', fontWeight: 'bold', alignment: 'center', type: 'text' },
                { id: 'name', text: '{{Learner Name}}', x: 50, y: 44, fontSize: 36, color: '#1f2937', fontWeight: 'bold', alignment: 'center', type: 'text' },
                { id: 'description', text: newTemplate.description || 'for successfully completing the training program', x: 50, y: 53, fontSize: 14, color: '#4b5563', fontWeight: 'normal', alignment: 'center', type: 'text' },
                { id: 'course', text: '{{Course Title}}', x: 50, y: 62, fontSize: 24, color: '#111827', fontWeight: 'bold', alignment: 'center', type: 'text' },
                { id: 'date', text: '{{Completion Date}}', x: 30, y: 78, fontSize: 12, color: '#4b5563', fontWeight: 'normal', alignment: 'center', type: 'text' },
                { id: 'designation', text: newTemplate.designation || 'Managing Director', x: 70, y: 82, fontSize: 12, color: '#4b5563', fontWeight: 'normal', alignment: 'center', type: 'text' },
                { id: 'signature', text: 'Authorized Signature', x: 70, y: 73, fontSize: 12, color: '#111827', fontWeight: 'normal', alignment: 'center', type: 'image', imageUrl: newTemplate.signature, width: 120, height: 50 },
                { id: 'serial', text: 'ID: {{Certificate ID}}', x: 50, y: 90, fontSize: 10, color: '#9ca3af', fontWeight: 'normal', alignment: 'center', type: 'text' },
            ]
        };

        try {
            const res = await fetch('/api/admin/certificates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newTemplate.name,
                    backgroundImage: newTemplate.image,
                    designFields: designFieldsObj
                })
            });
            if (res.ok) {
                fetchTemplates();
                setShowUpload(false);
                setNewTemplate({
                    name: '',
                    image: '',
                    logo: '',
                    title: 'Certificate of Achievement',
                    description: 'for successfully completing the training program',
                    designation: 'Managing Director',
                    signature: ''
                });
                Swal.fire({
                    title: 'Success',
                    text: 'Template added successfully',
                    icon: 'success',
                    background: '#18181b',
                    color: '#fff'
                });
            } else {
                const errData = await res.json();
                Swal.fire('Error', errData.error || 'Failed to add', 'error');
            }
        } catch {
            Swal.fire('Error', 'Failed to add', 'error');
        }
    };

    const deleteTemplate = async (id: string) => {
        const confirmResult = await Swal.fire({
            title: 'Delete Template?',
            text: 'Are you sure? This action is irreversible.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel',
            background: '#18181b',
            color: '#fff',
            confirmButtonColor: '#ef4444'
        });
        if (!confirmResult.isConfirmed) return;

        try {
            const res = await fetch(`/api/admin/certificates?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchTemplates();
                Swal.fire({
                    title: 'Deleted',
                    text: 'Successfully removed template',
                    icon: 'success',
                    background: '#18181b',
                    color: '#fff'
                });
            } else {
                const errData = await res.json();
                Swal.fire('Error', errData.error || 'Failed to delete', 'error');
            }
        } catch {
            Swal.fire('Error', 'Failed to delete', 'error');
        }
    };

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8 text-white max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black tracking-tight uppercase flex items-center gap-3">
                        <Award className="w-8 h-8 text-purple-500" /> Global Certificate Library
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage standard certificate backgrounds available for all platform tenants.</p>
                </div>
                <button
                    onClick={() => setShowUpload(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-sm transition-all hover:scale-105 shadow-xl shadow-purple-500/20 cursor-pointer"
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
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-purple-500/50" />
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Syncing Library...</p>
                </div>
            ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-32 border-2 border-dashed border-white/10 rounded-[2.5rem] bg-white/5">
                    <Award className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <p className="font-bold text-lg">No templates found</p>
                    <p className="text-muted-foreground text-sm">Upload a global template background to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredTemplates.map((template) => (
                        <div key={template.id} className="group bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden hover:border-purple-500/30 transition-all shadow-2xl relative">
                            <div className="aspect-[1.414/1] bg-black/40 relative overflow-hidden flex items-center justify-center">
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
                                        deleteTemplate(template.id);
                                    }}
                                    className="p-2.5 rounded-xl transition-all flex items-center gap-2 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 cursor-pointer"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload/Creation Modal */}
            {showUpload && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-zinc-900 border border-white/10 w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
                        <div className="text-center space-y-2">
                            <h3 className="text-2xl font-black uppercase tracking-tight">New Global Template</h3>
                            <p className="text-sm text-zinc-400">Configure background and layout elements.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Template Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Executive Achievement"
                                        value={newTemplate.name}
                                        onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Certificate Title</label>
                                    <input
                                        type="text"
                                        value={newTemplate.title}
                                        onChange={(e) => setNewTemplate(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Description Statement</label>
                                    <textarea
                                        value={newTemplate.description}
                                        onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                                        rows={2}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Signatory Designation</label>
                                    <input
                                        type="text"
                                        value={newTemplate.designation}
                                        onChange={(e) => setNewTemplate(prev => ({ ...prev, designation: e.target.value }))}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Background Image</label>
                                    <label className="flex flex-col items-center justify-center aspect-[1.414/1] bg-black/40 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-black/60 p-4 transition-all group overflow-hidden relative min-h-[120px]">
                                        {newTemplate.image ? (
                                            <img src={newTemplate.image} className="w-full h-full object-cover rounded-lg" alt="Background Preview" />
                                        ) : (
                                            <div className="text-center">
                                                <Upload className="w-6 h-6 mx-auto text-zinc-500 group-hover:text-purple-400 transition-colors" />
                                                <p className="text-[10px] font-bold text-zinc-400 mt-2">Upload Landscape BG</p>
                                            </div>
                                        )}
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'image')} />
                                    </label>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Company Logo</label>
                                        <label className="flex flex-col items-center justify-center h-20 bg-black/40 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-black/60 p-2 transition-all group overflow-hidden relative">
                                            {newTemplate.logo ? (
                                                <img src={newTemplate.logo} className="w-full h-full object-contain" alt="Logo Preview" />
                                            ) : (
                                                <Upload className="w-4 h-4 text-zinc-500 group-hover:text-purple-400" />
                                            )}
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
                                        </label>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Authorized Signature</label>
                                        <label className="flex flex-col items-center justify-center h-20 bg-black/40 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-black/60 p-2 transition-all group overflow-hidden relative">
                                            {newTemplate.signature ? (
                                                <img src={newTemplate.signature} className="w-full h-full object-contain" alt="Signature Preview" />
                                            ) : (
                                                <Upload className="w-4 h-4 text-zinc-500 group-hover:text-purple-400" />
                                            )}
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'signature')} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4 border-t border-white/10">
                            <button
                                onClick={() => setShowUpload(false)}
                                className="flex-1 py-3.5 bg-zinc-800 text-zinc-400 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-zinc-700 transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createTemplate}
                                disabled={!newTemplate.name || !newTemplate.image || uploading}
                                className="flex-1 py-3.5 bg-purple-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-purple-500 disabled:opacity-50 transition-all shadow-xl shadow-purple-500/20 cursor-pointer"
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
