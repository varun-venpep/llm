'use client';

import { useState, useEffect } from 'react';
import { Plus, Building, UsersRound, Loader2, Pencil, Check, X, ShieldCheck, Trash2, Users, FileText, Shield, BarChart3, AlertCircle, AlertTriangle } from 'lucide-react';
import { PeopleMultiSelect } from '../shared/PeopleMultiSelect';
import { GroupInsightsSlideOver } from '../shared/GroupInsightsSlideOver';

// ─────────────────────────────────────────────
// Slide-over drawer for editing a team
// ─────────────────────────────────────────────
function TeamSlideOver({ editingTeam, learners, setEditingTeam, onSave, onDelete, validationErrors, setValidationErrors }: {
    editingTeam: any;
    learners: any[];
    setEditingTeam: (t: any) => void;
    onSave: () => void;
    onDelete: () => void;
    validationErrors: Record<string, string | null>;
    setValidationErrors: React.Dispatch<React.SetStateAction<Record<string, string | null>>>;
}) {
    const [confirmDelete, setConfirmDelete] = useState(false);

    // Reset confirm on team change
    useEffect(() => {
        setConfirmDelete(false);
        setValidationErrors({});
    }, [editingTeam?.id, setValidationErrors]);

    const toggleManager = (id: string) => {
        const curr = editingTeam.managerIds || [];
        setEditingTeam({ ...editingTeam, managerIds: curr.includes(id) ? curr.filter((m: string) => m !== id) : [...curr, id] });
    };
    const toggleMember = (id: string) => {
        const curr = editingTeam.memberIds || [];
        setEditingTeam({ ...editingTeam, memberIds: curr.includes(id) ? curr.filter((m: string) => m !== id) : [...curr, id] });
    };

    if (!editingTeam) return null;

    const managerCount = (editingTeam.managerIds || []).length;
    const memberCount = (editingTeam.memberIds || []).length;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[290] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => setEditingTeam(null)}
            />

            {/* Centered Modal */}
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 pointer-events-none">
                <div className="pointer-events-auto w-full max-w-2xl max-h-[90vh] flex flex-col bg-background border border-border/60 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">

                    {/* ── Header ── */}
                    <div className="flex items-start justify-between px-8 py-6 border-b border-border/50 flex-shrink-0 bg-gradient-to-r from-primary/5 to-transparent">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Building size={16} className="text-primary" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{editingTeam.isEditing ? 'Editing Team' : 'New Department'}</p>
                            </div>
                            <h2 className="text-2xl font-black truncate max-w-sm">{editingTeam.name || (editingTeam.isEditing ? 'Untitled Team' : 'Organize New Team')}</h2>
                            {editingTeam.isEditing && (
                                <div className="flex items-center gap-4 mt-2">
                                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                                        <Shield size={11} className="text-primary" /> {managerCount} Manager{managerCount !== 1 ? 's' : ''}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                                        <Users size={11} className="text-primary" /> {memberCount} Member{memberCount !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            )}
                        </div>
                        <button onClick={() => setEditingTeam(null)}
                            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    {/* ── Scrollable body ── */}
                    <div className="flex-1 overflow-y-auto px-8 py-7 space-y-8">

                        {/* Basic Info */}
                        <section className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <FileText size={11} /> Basic Details
                            </h3>
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground">Team Name</label>
                                    <input
                                        value={editingTeam.name}
                                        onChange={e => {
                                            setEditingTeam({ ...editingTeam, name: e.target.value });
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
                                        value={editingTeam.description || ''}
                                        onChange={e => {
                                            setEditingTeam({ ...editingTeam, description: e.target.value });
                                            if (validationErrors.description) {
                                                setValidationErrors(prev => ({ ...prev, description: null }));
                                            }
                                        }}
                                        rows={3}
                                        placeholder="Describe this team's purpose..."
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

                        {/* Status Toggle */}
                        <section className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <ShieldCheck size={11} /> Team Availability
                            </h3>
                            <div
                                onClick={() => setEditingTeam({ ...editingTeam, isActive: !editingTeam.isActive })}
                                className="p-4 rounded-2xl bg-secondary/20 border border-border/50 flex items-center justify-between cursor-pointer hover:bg-secondary/30 transition-all"
                            >
                                <div className="space-y-1">
                                    <p className="text-sm font-bold">{editingTeam.isActive ? 'Team is Active' : 'Team is Inactive'}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {editingTeam.isActive
                                            ? 'Learners in this team can access all department-exclusive courses.'
                                            : 'Course access for this team will be temporarily suspended.'}
                                    </p>
                                </div>
                                <div className={`w-10 h-5 rounded-full p-0.5 transition-all relative flex items-center ${editingTeam.isActive ? 'bg-emerald-500' : 'bg-secondary border border-border/40'}`}>
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all ${editingTeam.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                            </div>
                        </section>

                        {/* Managers */}
                        <section className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Shield size={11} className="text-primary" /> Management
                            </h3>
                            <PeopleMultiSelect
                                label="Team Managers"
                                icon={ShieldCheck}
                                people={learners}
                                selectedIds={editingTeam.managerIds || []}
                                onToggle={toggleManager}
                                placeholder="Search managers by name or email..."
                            />
                        </section>

                        {/* Members */}
                        <section className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Users size={11} className="text-primary" /> Roster
                            </h3>
                            <PeopleMultiSelect
                                label="Team Members"
                                icon={UsersRound}
                                people={learners}
                                selectedIds={editingTeam.memberIds || []}
                                onToggle={toggleMember}
                                placeholder="Search learners by name or email..."
                            />
                        </section>

                        {/* Danger zone */}
                        {editingTeam.isEditing && (
                            <section className="pt-4 border-t border-border/30 space-y-3">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-red-500/70 flex items-center gap-2">
                                    <Trash2 size={11} /> Danger Zone
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setConfirmDelete(true)}
                                    className="w-full py-3 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={13} /> Delete this team
                                </button>
                            </section>
                        )}
                    </div>

                    {/* ── Sticky Footer ── */}
                    <div className="flex-shrink-0 flex items-center gap-3 px-8 py-5 border-t border-border/50 bg-background/80 backdrop-blur-sm">
                        <button onClick={() => setEditingTeam(null)}
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
                                Delete {editingTeam.name || 'Team'}?
                            </h3>

                            {/* Description */}
                            <p className="text-sm text-zinc-400 leading-relaxed max-w-[280px] mb-8">
                                Are you sure you want to delete this team? All member assignments will be affected.
                            </p>

                            {/* Actions Buttons */}
                            <div className="flex items-center gap-3 w-full justify-center">
                                <button
                                    type="button"
                                    onClick={onDelete}
                                    className="flex-1 py-3.5 bg-[#e50000] hover:bg-[#ff1a1a] text-white rounded-xl text-xs font-black tracking-wider uppercase transition-colors"
                                >
                                    YES, DELETE TEAM
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
// Main TeamsManager
// ─────────────────────────────────────────────
export function TeamsManager({ domain, addToast }: { domain: string, addToast: (msg: string, type?: 'success' | 'error') => void }) {
    const [teams, setTeams] = useState<any[]>([]);
    const [learners, setLearners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingTeam, setEditingTeam] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [validationErrors, setValidationErrors] = useState<Record<string, string | null>>({});

    // Insights State
    const [isInsightsOpen, setIsInsightsOpen] = useState(false);
    const [insightsTeamId, setInsightsTeamId] = useState<string | null>(null);

    useEffect(() => { fetchData(); }, [domain]);

    const fetchData = async () => {
        try {
            const [teamsRes, learnersRes] = await Promise.all([
                fetch(`/api/t/${domain}/teams`),
                fetch(`/api/t/${domain}/learners`)
            ]);
            if (teamsRes.ok) setTeams(await teamsRes.json());
            if (learnersRes.ok) setLearners(await learnersRes.json());
        } catch (e) {
            console.error('Failed to fetch data', e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTeam = async () => {
        const errors: Record<string, string | null> = {};
        if (!editingTeam?.name?.trim()) {
            errors.name = 'Team name is required';
        }
        if (!editingTeam?.description?.trim()) {
            errors.description = 'Description is required';
        }

        // Check for duplicate team name
        if (editingTeam?.name?.trim()) {
            const targetName = editingTeam.name.trim().toLowerCase();
            const nameExists = teams.some(t => t.name.trim().toLowerCase() === targetName);
            if (nameExists) {
                errors.name = 'Team name already exists in this workspace';
            }
        }

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }
        setValidationErrors({});

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/t/${domain}/teams`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editingTeam.name,
                    description: editingTeam.description,
                    isActive: editingTeam.isActive ?? true,
                    managerIds: editingTeam.managerIds || [],
                    memberIds: editingTeam.memberIds || []
                })
            });
            if (res.ok) {
                addToast('Team created successfully', 'success');
                setEditingTeam(null);
                fetchData();
            } else {
                addToast('Failed to create team', 'error');
            }
        } catch (e) {
            addToast('Error creating team', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateTeam = async () => {
        if (!editingTeam) return;
        const errors: Record<string, string | null> = {};
        if (!editingTeam?.name?.trim()) {
            errors.name = 'Team name is required';
        }
        if (!editingTeam?.description?.trim()) {
            errors.description = 'Description is required';
        }

        // Check for duplicate team name
        if (editingTeam?.name?.trim()) {
            const targetName = editingTeam.name.trim().toLowerCase();
            const nameExists = teams.some(t => t.name.trim().toLowerCase() === targetName && t.id !== editingTeam.id);
            if (nameExists) {
                errors.name = 'Team name already exists in this workspace';
            }
        }

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }
        setValidationErrors({});

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/t/${domain}/teams`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingTeam.id,
                    name: editingTeam.name,
                    description: editingTeam.description,
                    isActive: editingTeam.isActive,
                    managerIds: editingTeam.managerIds || [],
                    memberIds: editingTeam.memberIds || []
                })
            });
            if (res.ok) {
                addToast('Team updated successfully', 'success');
                setEditingTeam(null);
                fetchData();
            } else {
                addToast('Failed to update team', 'error');
            }
        } catch (e) {
            addToast('Error updating team', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusToggle = async (team: any) => {
        try {
            const res = await fetch(`/api/t/${domain}/teams`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: team.id, isActive: !team.isActive })
            });
            if (res.ok) {
                fetchData();
            }
        } catch (e) {
            addToast('Status update failed', 'error');
        }
    };

    const handleDeleteTeam = async () => {
        if (!editingTeam) return;
        try {
            const res = await fetch(`/api/t/${domain}/teams?id=${editingTeam.id}`, { method: 'DELETE' });
            if (res.ok) {
                addToast('Team deleted', 'success');
                setEditingTeam(null);
                fetchData();
            } else {
                addToast('Failed to delete team', 'error');
            }
        } catch (e) {
            addToast('Error deleting team', 'error');
        }
    };

    const openCreate = () => {
        setEditingTeam({ name: '', description: '', managerIds: [], memberIds: [], isActive: true, isEditing: false });
    };

    const openEdit = (team: any) => {
        setEditingTeam({
            ...team,
            managerIds: team.managers?.map((m: any) => m.id) || [],
            memberIds: team.members?.map((m: any) => m.id) || [],
            isEditing: true
        });
    };

    const handleInsights = (team: any) => {
        setInsightsTeamId(team.id);
        setIsInsightsOpen(true);
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-8">
            <div className="glassmorphism p-8 rounded-3xl border border-border/50">
                <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-3">
                        <Building className="text-primary w-6 h-6" />
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight">Teams & Departments</h2>
                            <p className="text-sm text-muted-foreground">Organize your talent by departments and assign leadership.</p>
                        </div>
                    </div>
                    <button
                        onClick={openCreate}
                        className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 flex items-center gap-2 shadow-xl shadow-primary/20"
                    >
                        <Plus size={18} /> New Team
                    </button>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search teams..."
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
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Department</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Managers</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Audience</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Access</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                            {loading ? (
                                <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="animate-spin text-primary inline-block" /></td></tr>
                            ) : teams.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                                <tr><td colSpan={5} className="py-20 text-center text-muted-foreground text-sm italic">No departments found.</td></tr>
                            ) : teams.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())).map(team => (
                                <tr key={team.id} className="hover:bg-primary/5 transition-all group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-secondary border border-border/50 flex items-center justify-center text-primary group-hover:border-primary/50 transition-colors">
                                                <Building size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <span className="block font-bold text-sm truncate">{team.name}</span>
                                                <span className="text-[10px] text-muted-foreground truncate block max-w-xs">{team.description || 'No focus area defined'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-wrap gap-1">
                                            {team.managers?.length > 0 ? (
                                                team.managers.map((mgr: any) => (
                                                    <span key={mgr.id} className="inline-flex items-center gap-1 text-[9px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/15">
                                                        <ShieldCheck size={10} /> {mgr.name || mgr.email}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-[10px] text-muted-foreground italic opacity-50">No managers assigned</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="inline-flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2.5 py-1.5 rounded-lg border border-primary/10">
                                            <UsersRound size={12} /> {team._count?.members || team.members?.length || 0}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div
                                            onClick={() => handleStatusToggle(team)}
                                            className="flex items-center gap-2 cursor-pointer group/toggle"
                                        >
                                            <div className={`w-8 h-4 rounded-full p-0.5 transition-all relative ${team.isActive ? 'bg-emerald-500' : 'bg-secondary border border-border/40'}`}>
                                                <div className={`w-3 h-3 rounded-full shadow-sm transition-all bg-white ${team.isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                {team.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleInsights(team)}
                                            className="p-2 rounded-xl bg-secondary/50 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                                            title="View Team Insights"
                                        >
                                            <BarChart3 size={14} />
                                        </button>
                                        <button
                                            onClick={() => openEdit(team)}
                                            className="p-2 rounded-xl bg-secondary/50 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                                            title="Edit Team"
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
                groupId={insightsTeamId}
                type="team"
                domain={domain}
            />

            {/* Slide-over drawer */}
            <TeamSlideOver
                editingTeam={editingTeam}
                learners={learners}
                setEditingTeam={setEditingTeam}
                onSave={editingTeam?.isEditing ? handleUpdateTeam : handleCreateTeam}
                onDelete={handleDeleteTeam}
                validationErrors={validationErrors}
                setValidationErrors={setValidationErrors}
            />
        </div>
    );
}
