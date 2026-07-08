'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Shield, Users, Loader2, Pencil, Check, X, ShieldCheck, FileText, BarChart3, AlertCircle, AlertTriangle } from 'lucide-react';
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
function RoleSlideOver({ editingRole, learners, setEditingRole, onSave, onDelete, validationErrors, setValidationErrors }: {
    editingRole: any;
    learners: any[];
    setEditingRole: (r: any) => void;
    onSave: () => void;
    onDelete: () => void;
    validationErrors: Record<string, string | null>;
    setValidationErrors: React.Dispatch<React.SetStateAction<Record<string, string | null>>>;
}) {
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        setConfirmDelete(false);
        setValidationErrors({});
    }, [editingRole?.id, setValidationErrors]);

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
                                        onChange={e => {
                                            setEditingRole({ ...editingRole, name: e.target.value });
                                            if (validationErrors.name) {
                                                setValidationErrors(prev => ({ ...prev, name: null }));
                                            }
                                        }}
                                        className={`w-full bg-secondary/30 border rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${validationErrors.name ? 'border-red-500/50' : 'border-border/50'}`}
                                    />
                                    {validationErrors.name && (
                                        <span className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-top-1 ml-1 block">
                                            {validationErrors.name}
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground">Description</label>
                                    <textarea
                                        value={editingRole.description || ''}
                                        onChange={e => {
                                            setEditingRole({ ...editingRole, description: e.target.value });
                                            if (validationErrors.description) {
                                                setValidationErrors(prev => ({ ...prev, description: null }));
                                            }
                                        }}
                                        rows={3}
                                        placeholder="Describe what this role involves..."
                                        className={`w-full bg-secondary/30 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none text-foreground placeholder:text-muted-foreground/40 ${validationErrors.description ? 'border-red-500/50' : 'border-border/50'}`}
                                    />
                                    {validationErrors.description && (
                                        <span className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-top-1 ml-1 block">
                                            {validationErrors.description}
                                        </span>
                                    )}
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
                                <div className={`w-10 h-5 rounded-full p-0.5 transition-all relative flex items-center ${editingRole.isActive ? 'bg-emerald-500' : 'bg-secondary border border-border/40'}`}>
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all ${editingRole.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
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
                        {editingRole.isEditing && (
                            <section className="pt-4 border-t border-border/30 space-y-3">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-red-500/70 flex items-center gap-2">
                                    <Trash2 size={11} /> Danger Zone
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setConfirmDelete(true)}
                                    className="w-full py-3 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={13} /> Delete this job role
                                </button>
                            </section>
                        )}
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

            {/* Delete Confirmation Modal */}
            {confirmDelete && (
                <>
                    {/* Modal Backdrop */}
                    <div
                        className="fixed inset-0 z-[390] bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
                        onClick={() => setConfirmDelete(false)}
                    />
                    
                    {/* Modal Content Container */}
                    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 pointer-events-none">
                        <div className="pointer-events-auto w-full max-w-md bg-[#0d0d10] border border-white/5 rounded-[32px] p-10 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
                            
                            {/* Alert Icon */}
                            <div className="mb-6">
                                <svg className="w-20 h-20 text-[#f3bf8e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="13" strokeLinecap="round" />
                                    <circle cx="12" cy="16.5" r="0.6" fill="currentColor" stroke="currentColor" strokeWidth="0.5" />
                                </svg>
                            </div>

                            {/* Title */}
                            <h3 className="text-white text-2xl font-bold tracking-tight mb-3">
                                Delete {editingRole.name || 'Role'}?
                            </h3>

                            {/* Description */}
                            <p className="text-sm text-zinc-400 leading-relaxed max-w-[280px] mb-8">
                                Are you sure you want to delete this role? All member assignments will be affected.
                            </p>

                            {/* Actions Buttons */}
                            <div className="flex items-center gap-3 w-full justify-center">
                                <button
                                    type="button"
                                    onClick={onDelete}
                                    className="flex-1 py-3.5 bg-[#e50000] hover:bg-[#ff1a1a] text-white rounded-xl text-xs font-black tracking-wider uppercase transition-colors"
                                >
                                    YES, DELETE ROLE
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setConfirmDelete(false)}
                                    className="flex-1 py-3.5 bg-[#242429] hover:bg-[#2f2f36] text-zinc-300 rounded-xl text-xs font-black tracking-wider uppercase transition-colors"
                                >
                                    CANCEL
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}

// ─────────────────────────────────────────────
// Main RolesManager
// ─────────────────────────────────────────────
export function RolesManager({ domain, addToast }: { domain: string, addToast: (msg: string, type?: 'success' | 'error') => void }) {
    const [roles, setRoles] = useState<JobRole[]>([]);
    const [allLearners, setAllLearners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingRole, setEditingRole] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [validationErrors, setValidationErrors] = useState<Record<string, string | null>>({});

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
        } catch (e) { }
    };

    const handleCreateRole = async () => {
        const errors: Record<string, string | null> = {};
        if (!editingRole?.name?.trim()) {
            errors.name = 'Role name is required';
        }
        if (!editingRole?.description?.trim()) {
            errors.description = 'Description is required';
        }

        // Check for duplicate name
        if (editingRole?.name?.trim()) {
            const targetName = editingRole.name.trim().toLowerCase();
            if (roles.some(r => r.name.trim().toLowerCase() === targetName)) {
                errors.name = 'Role name already exists in this workspace';
            }
        }

        // Check for duplicate description
        if (editingRole?.description?.trim()) {
            const targetDesc = editingRole.description.trim().toLowerCase();
            if (roles.some(r => r.description?.trim().toLowerCase() === targetDesc)) {
                errors.description = 'Role description already exists in this workspace';
            }
        }

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }
        setValidationErrors({});

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
                const data = await res.json().catch(() => ({}));
                addToast(data.error || 'Failed to create role', 'error');
            }
        } catch (e) {
            addToast('Error creating role', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateRole = async () => {
        if (!editingRole) return;
        const errors: Record<string, string | null> = {};
        if (!editingRole.name?.trim()) {
            errors.name = 'Role name is required';
        }
        if (!editingRole.description?.trim()) {
            errors.description = 'Description is required';
        }

        // Check for duplicate name
        if (editingRole.name?.trim()) {
            const targetName = editingRole.name.trim().toLowerCase();
            if (roles.some(r => r.name.trim().toLowerCase() === targetName && r.id !== editingRole.id)) {
                errors.name = 'Role name already exists in this workspace';
            }
        }

        // Check for duplicate description
        if (editingRole.description?.trim()) {
            const targetDesc = editingRole.description.trim().toLowerCase();
            if (roles.some(r => r.description?.trim().toLowerCase() === targetDesc && r.id !== editingRole.id)) {
                errors.description = 'Role description already exists in this workspace';
            }
        }

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }
        setValidationErrors({});

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
                                            <div className={`w-8 h-4 rounded-full p-0.5 transition-all relative ${role.isActive ? 'bg-emerald-500' : 'bg-secondary border border-border/40'}`}>
                                                <div className={`w-3 h-3 rounded-full shadow-sm transition-all bg-white ${role.isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                {role.isActive ? 'Active' : 'Inactive'}
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
                validationErrors={validationErrors}
                setValidationErrors={setValidationErrors}
            />
        </div>
    );
}
