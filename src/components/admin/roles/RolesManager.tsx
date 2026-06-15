'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Shield, Users, Loader2, Pencil, Check, X, ShieldCheck, FileText, BarChart3, AlertCircle } from 'lucide-react';
import { PeopleMultiSelect } from '../shared/PeopleMultiSelect';
import { GroupInsightsSlideOver } from '../shared/GroupInsightsSlideOver';

interface JobRole {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    _count: { users: number };
    users?: { id: string }[];
}

// ─────────────────────────────────────────────
// Slide-over drawer for editing a job role
// ─────────────────────────────────────────────
function RoleSlideOver({ editingRole, learners, setEditingRole, onSave, onDelete }: {
    editingRole: any;
    learners: any[];
    setEditingRole: (r: any) => void;
    onSave: () => void;
    onDelete: () => void;
}) {
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => setConfirmDelete(false), [editingRole?.id]);

    const toggleUser = (id: string) => {
        const curr = editingRole.assignedUserIds || [];
        setEditingRole({ ...editingRole, assignedUserIds: curr.includes(id) ? curr.filter((m: string) => m !== id) : [...curr, id] });
    };

    if (!editingRole) return null;

    const userCount = (editingRole.assignedUserIds || []).length;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[290] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => setEditingRole(null)}
            />

            {/* Centered Modal */}
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 pointer-events-none">
                <div className="pointer-events-auto w-full max-w-2xl max-h-[90vh] flex flex-col bg-background border border-border/60 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">

                {/* ── Header ── */}
                <div className="flex items-start justify-between px-8 py-6 border-b border-border/50 flex-shrink-0 bg-gradient-to-r from-primary/5 to-transparent">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Shield size={16} className="text-primary" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{editingRole.isEditing ? 'Editing Role' : 'New Job Role'}</p>
                    </div>
                    <h2 className="text-2xl font-black truncate max-w-sm">{editingRole.name || (editingRole.isEditing ? 'Untitled Role' : 'Define New Role')}</h2>
                    {editingRole.isEditing && (
                        <div className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                                <Users size={11} className="text-primary" /> {userCount} Learner{userCount !== 1 ? 's' : ''} Mapped
                            </span>
                        </div>
                    )}
                    </div>
                    <button onClick={() => setEditingRole(null)}
                        className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* ── Scrollable body ── */}
                <div className="flex-1 overflow-y-auto px-8 py-7 space-y-8">

                    {/* Basic Info */}
                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <FileText size={11} /> Role Details
                        </h3>
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground">Role Name</label>
                                <input
                                    value={editingRole.name}
                                    onChange={e => setEditingRole({ ...editingRole, name: e.target.value })}
                                    className="w-full bg-secondary/30 border border-border/50 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground">Description</label>
                                <textarea
                                    value={editingRole.description || ''}
                                    onChange={e => setEditingRole({ ...editingRole, description: e.target.value })}
                                    rows={3}
                                    placeholder="Describe what this role involves..."
                                    className="w-full bg-secondary/30 border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none text-foreground placeholder:text-muted-foreground/40"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Status Toggle in Slideover */}
                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <ShieldCheck size={11} /> Access Status
                        </h3>
                        <div 
                            onClick={() => setEditingRole({ ...editingRole, isActive: !editingRole.isActive })}
                            className="p-4 rounded-2xl bg-secondary/20 border border-border/50 flex items-center justify-between cursor-pointer hover:bg-secondary/30 transition-all"
                        >
                            <div className="space-y-1">
                                <p className="text-sm font-bold">{editingRole.isActive ? 'Role is Active' : 'Role is Inactive'}</p>
                                <p className="text-xs text-muted-foreground">
                                    {editingRole.isActive 
                                        ? 'Learners mapped to this role have full access to assigned curricula.' 
                                        : 'Learners will lose access to role-exclusive courses if disabled.'}
                                </p>
                            </div>
                            <div className={`w-10 h-5 rounded-full p-1 transition-all relative ${editingRole.isActive ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                                <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-all ${editingRole.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                        </div>
                    </section>

                    {/* Mapping */}
                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Users size={11} className="text-primary" /> Learner Mapping
                        </h3>
                        <PeopleMultiSelect
                            label="Assign Learners"
                            icon={ShieldCheck}
                            people={learners}
                            selectedIds={editingRole.assignedUserIds || []}
                            onToggle={toggleUser}
                            placeholder="Search for learners to assign this role..."
                        />
                    </section>

                    {/* Danger zone */}
                    <section className="pt-4 border-t border-border/30 space-y-3">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-red-500/70 flex items-center gap-2">
                            <Trash2 size={11} /> Danger Zone
                        </h3>
                        {!confirmDelete ? (
                            <button
                                type="button"
                                onClick={() => setConfirmDelete(true)}
                                className="w-full py-3 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
                            >
                                <Trash2 size={13} /> Delete this job role
                            </button>
                        ) : (
                            <div className="p-4 rounded-xl border border-red-500/40 bg-red-500/5 space-y-3">
                                <p className="text-xs font-bold text-red-400">Are you sure? This role will be removed from all assigned learners. This cannot be undone.</p>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setConfirmDelete(false)}
                                        className="flex-1 py-2.5 bg-secondary text-foreground rounded-xl text-xs font-bold hover:opacity-90">
                                        Cancel
                                    </button>
                                    <button type="button" onClick={onDelete}
                                        className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-1.5">
                                        <Trash2 size={12} /> Yes, Delete
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                </div>

                {/* ── Sticky Footer ── */}
                <div className="flex-shrink-0 flex items-center gap-3 px-8 py-5 border-t border-border/50 bg-background/80 backdrop-blur-sm">
                    <button onClick={() => setEditingRole(null)}
                        className="flex-1 py-3 bg-secondary text-foreground rounded-xl font-bold text-sm hover:opacity-90 transition-opacity">
                        Cancel
                    </button>
                    <button onClick={onSave}
                        className="flex-1 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                        <Check size={16} /> Save Changes
                    </button>
                </div>
            </div>
        </div>
    </>
    );
}

// ─────────────────────────────────────────────
// Main RolesManager
// ─────────────────────────────────────────────
export function RolesManager({ domain, addToast }: { domain: string, addToast: (msg: string, type?: 'success'|'error') => void }) {
    const [roles, setRoles] = useState<JobRole[]>([]);
    const [allLearners, setAllLearners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingRole, setEditingRole] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Insights State
    const [isInsightsOpen, setIsInsightsOpen] = useState(false);
    const [insightsRoleId, setInsightsRoleId] = useState<string | null>(null);

    useEffect(() => {
        fetchRoles();
        fetchLearners();
    }, [domain]);

    const fetchRoles = async () => {
        try {
            const res = await fetch(`/api/t/${domain}/roles`);
            if (res.ok) setRoles(await res.json());
        } catch (e) {
            console.error('Failed to fetch roles', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchLearners = async () => {
        try {
            const res = await fetch(`/api/t/${domain}/learners`);
            if (res.ok) setAllLearners(await res.json());
        } catch (e) {}
    };

    const handleCreateRole = async () => {
        if (!editingRole?.name?.trim()) {
            addToast('Role name is required', 'error');
            return;
        }
        if (!editingRole?.description?.trim()) {
            addToast('Description is required', 'error');
            return;
        }

        // Check for duplicate name
        const targetName = editingRole.name.trim().toLowerCase();
        if (roles.some(r => r.name.trim().toLowerCase() === targetName)) {
            addToast('Role name already exists in this workspace', 'error');
            return;
        }

        // Check for duplicate description
        const targetDesc = editingRole.description.trim().toLowerCase();
        if (roles.some(r => r.description?.trim().toLowerCase() === targetDesc)) {
            addToast('Role description already exists in this workspace', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/t/${domain}/roles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: editingRole.name, 
                    description: editingRole.description,
                    isActive: editingRole.isActive ?? true
                })
            });
            if (res.ok) {
                addToast('Role created successfully', 'success');
                setEditingRole(null);
                fetchRoles();
            } else {
                addToast('Failed to create role', 'error');
            }
        } catch (e) {
            addToast('Error creating role', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateRole = async () => {
        if (!editingRole) return;
        if (!editingRole.name?.trim()) {
            addToast('Role name is required', 'error');
            return;
        }
        if (!editingRole.description?.trim()) {
            addToast('Description is required', 'error');
            return;
        }

        // Check for duplicate name
        const targetName = editingRole.name.trim().toLowerCase();
        if (roles.some(r => r.name.trim().toLowerCase() === targetName && r.id !== editingRole.id)) {
            addToast('Role name already exists in this workspace', 'error');
            return;
        }

        // Check for duplicate description
        const targetDesc = editingRole.description.trim().toLowerCase();
        if (roles.some(r => r.description?.trim().toLowerCase() === targetDesc && r.id !== editingRole.id)) {
            addToast('Role description already exists in this workspace', 'error');
            return;
        }

        try {
            const res = await fetch(`/api/t/${domain}/roles`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: editingRole.id, 
                    name: editingRole.name, 
                    description: editingRole.description, 
                    isActive: editingRole.isActive,
                    userIds: editingRole.assignedUserIds || [] 
                })
            });
            if (res.ok) {
                addToast('Role updated successfully', 'success');
                setEditingRole(null);
                fetchRoles();
                fetchLearners();
            } else {
                addToast('Failed to update role', 'error');
            }
        } catch (e) {
            addToast('Error updating role', 'error');
        }
    };

    const handleStatusToggle = async (role: JobRole) => {
        try {
            const res = await fetch(`/api/t/${domain}/roles`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: role.id, isActive: !role.isActive })
            });
            if (res.ok) {
                addToast(`Role ${!role.isActive ? 'activated' : 'deactivated'}`, 'success');
                fetchRoles();
            }
        } catch (e) {
            addToast('Status update failed', 'error');
        }
    };

    const handleDeleteRole = async () => {
        if (!editingRole) return;
        try {
            const res = await fetch(`/api/t/${domain}/roles?id=${editingRole.id}`, { method: 'DELETE' });
            if (res.ok) {
                addToast('Role deleted successfully', 'success');
                setEditingRole(null);
                fetchRoles();
            } else {
                addToast('Failed to delete role', 'error');
            }
        } catch (e) {
            addToast('Error deleting role', 'error');
        }
    };

    const openEdit = (role: JobRole) => {
        const assigned = role.users?.map(u => u.id) || [];
        setEditingRole({ ...role, assignedUserIds: assigned, isEditing: true });
    };

    const openCreate = () => {
        setEditingRole({ name: '', description: '', assignedUserIds: [], isActive: true, isEditing: false });
    };

    const handleInsights = (role: JobRole) => {
        setInsightsRoleId(role.id);
        setIsInsightsOpen(true);
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-8">
            <div className="glassmorphism p-8 rounded-3xl border border-border/50">
                <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-3">
                        <Shield className="text-primary w-6 h-6" />
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight">Job Roles</h2>
                            <p className="text-sm text-muted-foreground">Define roles and map talent to specialized training paths.</p>
                        </div>
                    </div>
                    <button 
                        onClick={openCreate}
                        className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 flex items-center gap-2 shadow-xl shadow-primary/20"
                    >
                        <Plus size={18} /> Add Role
                    </button>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input 
                            type="text"
                            placeholder="Search job roles..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-secondary/30 border border-border/40 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-border/40">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-secondary/20 border-b border-border/40">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Role</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Audience</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Access</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                            {loading ? (
                                <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="animate-spin text-primary inline-block" /></td></tr>
                            ) : roles.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                                <tr><td colSpan={4} className="py-20 text-center text-muted-foreground text-sm italic">No matching job roles found.</td></tr>
                            ) : roles.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase())).map(role => (
                                <tr key={role.id} className="hover:bg-primary/5 transition-all group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-secondary border border-border/50 flex items-center justify-center text-primary group-hover:border-primary/50 transition-colors">
                                                <Shield size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <span className="block font-bold text-sm truncate">{role.name}</span>
                                                <span className="text-[10px] text-muted-foreground truncate block max-w-xs">{role.description || 'No description provided'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2.5 py-1.5 rounded-lg border border-primary/10">
                                            <Users size={12} /> {role._count.users}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div 
                                            onClick={() => handleStatusToggle(role)}
                                            className="flex items-center gap-2 cursor-pointer group/toggle"
                                        >
                                            <div className={`w-8 h-4 rounded-full p-0.5 transition-all relative ${role.isActive ? 'bg-primary/20 border border-primary/20' : 'bg-secondary border border-border/40'}`}>
                                                <div className={`w-3 h-3 rounded-full shadow-sm transition-all ${role.isActive ? 'translate-x-4 bg-primary' : 'translate-x-0 bg-muted-foreground'}`} />
                                            </div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${role.isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                                {role.isActive ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right flex items-center justify-end gap-2">
                                        <button 
                                            onClick={() => handleInsights(role)}
                                            className="p-2 rounded-xl bg-secondary/50 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                                            title="View Role Insights"
                                        >
                                            <BarChart3 size={14} />
                                        </button>
                                        <button 
                                            onClick={() => openEdit(role)}
                                            className="p-2 rounded-xl bg-secondary/50 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                                            title="Edit Role"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Insights Slide-over */}
            <GroupInsightsSlideOver 
                isOpen={isInsightsOpen}
                onClose={() => setIsInsightsOpen(false)}
                groupId={insightsRoleId}
                type="role"
                domain={domain}
            />

            {/* Role Edit Slide-over */}
            <RoleSlideOver
                editingRole={editingRole}
                learners={allLearners}
                setEditingRole={setEditingRole}
                onSave={editingRole?.isEditing ? handleUpdateRole : handleCreateRole}
                onDelete={handleDeleteRole}
            />
        </div>
    );
}
