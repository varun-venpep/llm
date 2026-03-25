'use client';

import { useState, useEffect } from 'react';
import { Search, MoreVertical, Building2, CheckCircle2, ShieldCheck, Edit2, Trash2, X, AlertTriangle, Loader2 } from 'lucide-react';

interface Tenant {
    id: string;
    name: string;
    subdomain: string;
    customDomain: string | null;
    isActive: boolean;
    createdAt: string;
    _count: {
        users: number;
        courses: number;
    };
}

export default function TenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    
    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
    const [editForm, setEditForm] = useState({ name: '', subdomain: '', isActive: true });
    const [isUpdating, setIsUpdating] = useState(false);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchTenants();
        
        // Close dropdown when clicking outside
        const handleClickOutside = () => setActiveDropdown(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const fetchTenants = async () => {
        try {
            const res = await fetch('/api/admin/tenants');
            const data = await res.json();
            setTenants(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (tenant: Tenant) => {
        setEditingTenant(tenant);
        setEditForm({ name: tenant.name, subdomain: tenant.subdomain, isActive: tenant.isActive });
        setIsEditModalOpen(true);
        setActiveDropdown(null);
    };

    const handleDeleteClick = (tenant: Tenant) => {
        setDeletingTenant(tenant);
        setIsDeleteModalOpen(true);
        setActiveDropdown(null);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTenant) return;
        setIsUpdating(true);
        try {
            const res = await fetch(`/api/admin/tenants/${editingTenant.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });
            if (res.ok) {
                await fetchTenants();
                setIsEditModalOpen(false);
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to update tenant');
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingTenant) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/admin/tenants/${deletingTenant.id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                await fetchTenants();
                setIsDeleteModalOpen(false);
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete tenant');
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black tracking-tight uppercase">Tenant Management</h1>
                    <p className="text-muted-foreground text-sm font-medium">Manage all active and inactive client workspaces across the platform.</p>
                </div>
            </div>

            <div className="glassmorphism rounded-2xl overflow-hidden border border-border/50">
                <div className="p-6 border-b border-border/50 flex justify-between items-center bg-secondary/20">
                    <h2 className="font-bold flex items-center gap-2"><Building2 className="w-5 h-5 text-blue-500" /> All Deployments</h2>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search organizations..."
                            className="bg-background/50 border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-64"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-border/50 bg-secondary/10">
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Workspace</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Domain</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Stats</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Created</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground text-right px-10">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-20 font-medium text-muted-foreground italic">Syncing with cloud...</td></tr>
                            ) : tenants.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-20 font-medium text-muted-foreground italic">No active deployments found.</td></tr>
                            ) : tenants.map((tenant) => (
                                <tr key={tenant.id} className="hover:bg-secondary/20 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-black text-blue-400">
                                                {tenant.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <span className="font-bold block">{tenant.name}</span>
                                                <span className="text-xs text-muted-foreground italic">ID: {tenant.id.substring(0, 8)}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-sm text-blue-400">
                                        /t/{tenant.subdomain}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-mono text-xs font-bold">{tenant._count.users} Users</span>
                                            <span className="font-mono text-[10px] text-muted-foreground uppercase">{tenant._count.courses} Courses</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {tenant.subdomain === 'admin-system' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold uppercase">
                                                <ShieldCheck className="w-3 h-3" /> System Core
                                            </span>
                                        ) : tenant.isActive ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">
                                                <CheckCircle2 className="w-3 h-3" /> Online
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase">
                                                Offline
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{new Date(tenant.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-right relative px-10">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === tenant.id ? null : tenant.id); }}
                                            className="p-2 rounded-lg hover:bg-background border border-transparent hover:border-border transition-all text-muted-foreground hover:text-foreground"
                                        >
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                        
                                        {activeDropdown === tenant.id && (
                                            <div className="absolute right-12 top-1/2 -translate-y-1/2 z-[100] bg-background border border-border rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 min-w-[120px] animate-in fade-in zoom-in-95 duration-100">
                                                <button 
                                                    onClick={() => handleEditClick(tenant)}
                                                    className="flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-secondary rounded-lg transition-colors text-blue-400"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" /> Edit
                                                </button>
                                                {tenant.subdomain !== 'admin-system' && (
                                                    <button 
                                                        onClick={() => handleDeleteClick(tenant)}
                                                        className="flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
                    <div className="bg-background border border-border w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2"><Edit2 className="w-5 h-5 text-blue-400" /> Edit Workspace</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-muted-foreground hover:text-foreground text-2xl">&times;</button>
                        </div>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Organization Name</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                    value={editForm.name}
                                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Subdomain</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-mono"
                                    value={editForm.subdomain}
                                    onChange={e => setEditForm({...editForm, subdomain: e.target.value})}
                                    disabled={editingTenant?.subdomain === 'admin-system'}
                                    required
                                />
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-secondary/20 rounded-2xl border border-border/50">
                                <input 
                                    type="checkbox" 
                                    id="isActive"
                                    className="w-4 h-4 rounded border-border text-blue-500 focus:ring-blue-500"
                                    checked={editForm.isActive}
                                    onChange={e => setEditForm({...editForm, isActive: e.target.checked})}
                                    disabled={editingTenant?.subdomain === 'admin-system'}
                                />
                                <label htmlFor="isActive" className="text-sm font-bold cursor-pointer">Workspace Active (Online)</label>
                            </div>
                            <button 
                                type="submit" 
                                disabled={isUpdating}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isUpdating ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
                    <div className="bg-background border border-border w-full max-w-sm rounded-3xl shadow-2xl p-8 space-y-6 text-center">
                        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight text-red-500">Delete Workspace?</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                                You are about to permanently delete <span className="font-bold text-foreground font-mono">{deletingTenant?.name}</span>. 
                                This action cannot be undone and will erase all data.
                            </p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button 
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isDeleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</> : 'Confirm Deletion'}
                            </button>
                            <button 
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="w-full py-3 bg-secondary text-foreground font-black uppercase tracking-widest text-xs rounded-xl hover:bg-secondary/70 transition-all border border-border"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
