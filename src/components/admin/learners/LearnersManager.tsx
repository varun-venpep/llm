'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Users, Plus, Trash2, ShieldCheck, Edit3, BarChart3,
    X, Check, Copy, RefreshCw, Mail, UserCheck,
    Shield, Briefcase, UsersRound, Loader2, Info,
    BookOpen, Clock, AlertTriangle, Upload, FileSpreadsheet, Download
} from 'lucide-react';
import { SearchableSelect } from '../shared/SearchableSelect';
import { PeopleMultiSelect } from '../shared/PeopleMultiSelect';
import { ALL_TENANT_ADMIN_PERMISSIONS, TENANT_ADMIN_PERMISSIONS, type TenantAdminPermission } from '@/lib/permissions';

interface Learner {
    id: string;
    email: string;
    name: string | null;
    role: string;
    tenantAdminPermissions?: TenantAdminPermission[];
    isActive: boolean;
    createdAt: string;
    jobRoles?: { id: string, name: string }[];
    teams: { id: string, name: string }[];
    managedTeams?: { id: string, name: string }[];
    enrollments: any[];
    progress: any[];
    _count?: { enrollments: number };
}

// ─────────────────────────────────────────────
// Learner Assignment Drawer (Slide-Over)
// ─────────────────────────────────────────────
function LearnerSlideOver({
    isOpen,
    onClose,
    learner,
    isCreating,
    mode,
    roles,
    teams,
    onSubmit,
    onDelete,
    justCreated,
    resetPassword,
    onResetPassword,
    isSubmitting,
    validationErrors,
    setValidationErrors
}: {
    isOpen: boolean;
    onClose: () => void;
    learner: any;
    isCreating: boolean;
    mode: 'learners' | 'admins';
    roles: any[];
    teams: any[];
    onSubmit: (data: any) => void;
    onDelete: (id: string) => void;
    justCreated?: any;
    resetPassword?: string;
    onResetPassword?: () => void;
    isSubmitting: boolean;
    validationErrors: Record<string, string | null>;
    setValidationErrors: React.Dispatch<React.SetStateAction<Record<string, string | null>>>;
}) {
    const [formData, setFormData] = useState(learner || {});
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [copyStatus, setCopyStatus] = useState<string | null>(null);

    useEffect(() => {
        if (learner) {
            setFormData(learner);
        }
        setConfirmDelete(false);
        setValidationErrors({});
    }, [learner, isOpen, setValidationErrors]);

    if (!isOpen || !formData) return null;

    const handleCopy = (text: string, type: 'pwd' | 'link') => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        } else {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
        setCopyStatus(type);
        setTimeout(() => setCopyStatus(null), 2000);
    };

    const accountRole = formData.role || 'LEARNER';
    const isAdminsMode = mode === 'admins';
    const tenantAdminPermissions = Array.isArray(formData.tenantAdminPermissions)
        ? formData.tenantAdminPermissions
        : [];
    const toggleTenantAdminPermission = (permission: TenantAdminPermission) => {
        const nextPermissions = tenantAdminPermissions.includes(permission)
            ? tenantAdminPermissions.filter((item: TenantAdminPermission) => item !== permission)
            : [...tenantAdminPermissions, permission];
        setFormData({ ...formData, tenantAdminPermissions: nextPermissions });
    };
    const accessUrl = (() => {
        if (typeof window === 'undefined') return `/t/${formData.domain}/login?forceLogin=1`;
        const isTenantSubdomain = window.location.hostname.startsWith(`${formData.domain}.`);
        return isTenantSubdomain
            ? `${window.location.origin}/login?forceLogin=1`
            : `${window.location.origin}/t/${formData.domain}/login?forceLogin=1`;
    })();

    return (
        <>
            <div className="fixed inset-0 z-[290] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 pointer-events-none">
                <div className="pointer-events-auto w-full max-w-2xl max-h-[90vh] flex flex-col bg-background border border-border/60 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">

                    {/* Header */}
                    <div className="flex items-start justify-between px-8 py-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Users className="text-primary w-4 h-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    {isCreating ? (isAdminsMode ? 'Create Admin User' : 'Create Learner') : (isAdminsMode ? 'Edit Admin User' : 'Edit Learner')}
                                </p>
                            </div>
                            <h2 className="text-2xl font-black truncate max-w-md">
                                {justCreated ? 'Creation Successful!' : isCreating ? (isAdminsMode ? 'New Admin' : 'New Learner') : formData.name || (isAdminsMode ? 'Edit Admin' : 'Edit Learner')}
                            </h2>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-8 py-7 space-y-8">
                        {justCreated ? (
                            <div className="space-y-6 animate-in zoom-in-95 duration-300">
                                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center text-center">
                                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                                        <UserCheck size={32} className="text-emerald-500" />
                                    </div>
                                    <h3 className="text-lg font-bold text-emerald-400">Identity Registered</h3>
                                    <p className="text-sm text-muted-foreground mt-1 px-4">The account has been successfully provisioned. Share the credentials below.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 group relative">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Temporary Password</p>
                                        <div className="flex items-center justify-between">
                                            <code className="font-mono font-black text-lg text-primary tracking-wider">{justCreated.password}</code>
                                            <button
                                                onClick={() => handleCopy(justCreated.password, 'pwd')}
                                                className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all flex items-center gap-2"
                                            >
                                                {copyStatus === 'pwd' ? <Check size={14} /> : <Copy size={14} />}
                                                <span className="text-[10px] font-bold uppercase">{copyStatus === 'pwd' ? 'Copied' : 'Copy'}</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl border border-blue-500/10 bg-blue-500/5">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">Access Endpoint</p>
                                        <div className="flex items-center justify-between gap-3">
                                            <code className="text-xs text-blue-300 truncate font-mono">{accessUrl}</code>
                                            <button
                                                onClick={() => handleCopy(accessUrl, 'link')}
                                                className="p-2 text-blue-400 hover:text-blue-300 text-[10px] font-bold uppercase transition-colors"
                                            >
                                                {copyStatus === 'link' ? 'Copied' : 'Copy Link'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <button onClick={onClose} className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                                    Close Panel
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Identity Section */}
                                <section className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <Shield size={11} className="text-primary" /> Identity & Access
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-muted-foreground ml-1">Full Name</label>
                                            <input
                                                value={formData.name || ''}
                                                onChange={e => {
                                                    setFormData({ ...formData, name: e.target.value });
                                                    if (validationErrors.name) {
                                                        setValidationErrors(prev => ({ ...prev, name: null }));
                                                    }
                                                }}
                                                placeholder="e.g. Johnathan Doe"
                                                className={`w-full bg-secondary/30 border rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all ${validationErrors.name ? 'border-red-500/50' : 'border-border/50'}`}
                                            />
                                            {validationErrors.name && (
                                                <span className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-top-1 ml-1 block">
                                                    {validationErrors.name}
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-muted-foreground ml-1">Email Address</label>
                                            <input
                                                type="email"
                                                value={formData.email || ''}
                                                onChange={e => {
                                                    setFormData({ ...formData, email: e.target.value });
                                                    if (validationErrors.email) {
                                                        setValidationErrors(prev => ({ ...prev, email: null }));
                                                    }
                                                }}
                                                placeholder="john@organization.com"
                                                className={`w-full bg-secondary/30 border rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all ${validationErrors.email ? 'border-red-500/50' : 'border-border/50'}`}
                                            />
                                            {validationErrors.email && (
                                                <span className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-top-1 ml-1 block">
                                                    {validationErrors.email}
                                                </span>
                                            )}
                                        </div>
                                        {isAdminsMode && (
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-muted-foreground ml-1">Account Type</label>
                                                <select
                                                    value={accountRole}
                                                    onChange={e => {
                                                        const nextRole = e.target.value;
                                                        setFormData({
                                                            ...formData,
                                                            role: nextRole,
                                                            tenantAdminPermissions
                                                        });
                                                    }}
                                                    className="w-full bg-background border border-border/50 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                                                >
                                                    <option value="TENANT_ADMIN" className="bg-background text-foreground">Domain Admin</option>
                                                    <option value="PLATFORM_MANAGER" className="bg-background text-foreground">Platform Manager</option>
                                                    <option value="INSTRUCTOR" className="bg-background text-foreground">Instructor</option>
                                                    <option value="TEACHER" className="bg-background text-foreground">Teacher</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {isAdminsMode && <section className="space-y-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <ShieldCheck size={11} className="text-primary" /> Domain Permissions
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, tenantAdminPermissions: ALL_TENANT_ADMIN_PERMISSIONS })}
                                            className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                                        >
                                            Select All
                                        </button>
                                    </div>
                                    <div className="grid gap-2">
                                        {TENANT_ADMIN_PERMISSIONS.map(permission => {
                                            const isEnabled = tenantAdminPermissions.includes(permission.key);

                                            return (
                                                <button
                                                    key={permission.key}
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={isEnabled}
                                                    onClick={() => toggleTenantAdminPermission(permission.key)}
                                                    className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-border/40 bg-secondary/20 p-3 text-left transition-colors hover:bg-secondary/30"
                                                >
                                                    <span className="min-w-0">
                                                        <span className="block text-xs font-bold">{permission.label}</span>
                                                        <span className="block text-[10px] text-muted-foreground">{permission.description}</span>
                                                    </span>
                                                    <span className={`flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-all ${isEnabled ? 'bg-emerald-500' : 'bg-secondary border border-border/40'}`}>
                                                        <span className={`h-4 w-4 rounded-full bg-white shadow-sm transition-all ${isEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </section>}

                                {/* Organization Section */}
                                <section className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <Briefcase size={11} className="text-primary" /> Organizational Context
                                    </h3>
                                    <div className="space-y-5">
                                        <PeopleMultiSelect
                                            label="Assigned Roles"
                                            icon={Briefcase}
                                            people={roles}
                                            selectedIds={formData.jobRoleIds || []}
                                            onToggle={id => {
                                                const curr = formData.jobRoleIds || [];
                                                setFormData({ ...formData, jobRoleIds: curr.includes(id) ? curr.filter((t: string) => t !== id) : [...curr, id] });
                                            }}
                                            placeholder="Add to roles..."
                                        />
                                        <PeopleMultiSelect
                                            label="Assigned Teams"
                                            icon={UsersRound}
                                            people={teams} // Reusing people as teams is fine if it matches Option interface
                                            selectedIds={formData.teamIds || []}
                                            onToggle={id => {
                                                const curr = formData.teamIds || [];
                                                setFormData({ ...formData, teamIds: curr.includes(id) ? curr.filter((t: string) => t !== id) : [...curr, id] });
                                            }}
                                            placeholder="Add to departments..."
                                        />
                                        <PeopleMultiSelect
                                            label="Manager Permissions (Executive Hub)"
                                            icon={ShieldCheck}
                                            people={teams}
                                            selectedIds={formData.managedTeamIds || []}
                                            onToggle={id => {
                                                const curr = formData.managedTeamIds || [];
                                                setFormData({ ...formData, managedTeamIds: curr.includes(id) ? curr.filter((t: string) => t !== id) : [...curr, id] });
                                            }}
                                            placeholder="Assign as manager to teams..."
                                        />
                                    </div>
                                </section>

                                {/* Security / Password Section for Existing Users */}
                                {!isCreating && (
                                    <section className="space-y-4 pt-4 border-t border-border/20">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <RefreshCw size={11} /> Credential Management
                                        </h3>
                                        {resetPassword ? (
                                            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">New Password Generated</span>
                                                    <button onClick={() => handleCopy(resetPassword, 'pwd')} className="text-xs font-bold text-orange-400 hover:underline">Copy</button>
                                                </div>
                                                <code className="block text-lg font-black font-mono tracking-wider">{resetPassword}</code>
                                                <p className="text-[10px] text-muted-foreground">This password is not stored. Please copy and provide it to the learner immediately.</p>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={onResetPassword}
                                                className="w-full py-3 px-4 bg-secondary/50 border border-border/50 rounded-xl text-xs font-bold hover:bg-secondary transition-all flex items-center justify-center gap-2"
                                            >
                                                <RefreshCw size={14} /> Force Password Reset
                                            </button>
                                        )}
                                    </section>
                                )}

                                {/* Danger Zone */}
                                {!isCreating && (
                                    <section className="space-y-4 pt-4 border-t border-border/20">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-red-500/70 flex items-center gap-2">
                                            <Trash2 size={11} /> Danger Zone
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => setConfirmDelete(true)}
                                            className="w-full py-3 border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-xl text-xs font-bold transition-all"
                                        >
                                            Archive Learner Identity
                                        </button>
                                    </section>
                                )}
                            </div>
                        )}
                    </div>

                    {!justCreated && (
                        <div className="flex-shrink-0 flex items-center gap-3 px-8 py-5 border-t border-border/50 bg-background/80 backdrop-blur-sm">
                            <button onClick={onClose} className="flex-1 py-3 bg-secondary text-foreground rounded-xl font-bold text-sm hover:opacity-90">
                                Cancel
                            </button>
                            <button
                                disabled={isSubmitting}
                                onClick={() => onSubmit(formData)}
                                className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                            >
                                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : isCreating ? (isAdminsMode ? 'Create Admin' : 'Create Learner') : 'Save Profile'}
                            </button>
                        </div>
                    )}
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
                                Delete {formData.name || 'User'}?
                            </h3>

                            {/* Description */}
                            <p className="text-sm text-zinc-400 leading-relaxed max-w-[280px] mb-8">
                                Are you sure you want to delete this user? All data and history will be affected.
                            </p>

                            {/* Actions Buttons */}
                            <div className="flex items-center gap-3 w-full justify-center">
                                <button
                                    type="button"
                                    onClick={() => onDelete(formData.id)}
                                    className="flex-1 py-3.5 bg-[#e50000] hover:bg-[#ff1a1a] text-white rounded-xl text-xs font-black tracking-wider uppercase transition-colors"
                                >
                                    YES, DELETE USER
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
// Learner Insights Drawer (Analytics)
// ─────────────────────────────────────────────
function LearnerInsightsSlideOver({
    isOpen,
    onClose,
    learner
}: {
    isOpen: boolean;
    onClose: () => void;
    learner: any | null;
}) {
    if (!isOpen || !learner) return null;

    // Calculate aggregated metrics
    const totalEnrollments = learner.enrollments?.length || 0;

    // Average progress check across all enrollments
    const totalLessons = learner.enrollments?.reduce((acc: number, en: any) =>
        acc + (en.course?.modules?.reduce((macc: number, m: any) => macc + (m.lessons?.length || 0), 0) || 0), 0) || 0;
    const completedLessons = learner.progress?.filter((p: any) => p.status === 'COMPLETED').length || 0;
    const avgProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    const quizAccuracy = learner.quizAttempts?.length > 0
        ? Math.round(learner.quizAttempts.reduce((acc: any, curr: any) => acc + curr.score, 0) / learner.quizAttempts.length)
        : 0;

    return (
        <>
            <div className="fixed inset-0 z-[290] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 pointer-events-none">
                <div className="pointer-events-auto w-full max-w-2xl max-h-[90vh] flex flex-col bg-background border border-border/60 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">

                    {/* Header */}
                    <div className="flex items-start justify-between px-8 py-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xl">
                                {learner.name?.[0]?.toUpperCase() || learner.email?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-0.5">Learner Analytics</p>
                                <h2 className="text-2xl font-black truncate max-w-sm">{learner.name || 'Anonymous Talent'}</h2>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-8 py-7 space-y-10">
                        {/* KPI Grid */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 rounded-2xl bg-secondary/20 border border-border/50 space-y-1">
                                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Enrollments</p>
                                <p className="text-xl font-black text-foreground">{totalEnrollments}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 space-y-1">
                                <p className="text-[9px] font-black uppercase text-emerald-500/70 tracking-widest">Avg Progress</p>
                                <p className="text-xl font-black text-emerald-400">{avgProgress}%</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-1">
                                <p className="text-[9px] font-black uppercase text-blue-500/70 tracking-widest">Assessment</p>
                                <p className="text-xl font-black text-blue-400">{quizAccuracy}%</p>
                            </div>
                        </div>

                        {/* Course Breakdown */}
                        <section className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <BookOpen size={11} className="text-primary" /> Enrollment Velocity
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                {learner.enrollments?.length > 0 ? learner.enrollments.map((en: any) => {
                                    const lessonsCount = en.course?.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0;
                                    const completedCount = learner.progress?.filter((p: any) => p.courseId === en.courseId && p.status === 'COMPLETED').length || 0;
                                    const pct = lessonsCount > 0 ? Math.round((completedCount / lessonsCount) * 100) : 0;

                                    return (
                                        <div key={en.id} className="p-4 rounded-2xl bg-secondary/10 border border-border/40 hover:border-primary/30 transition-all group">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold truncate group-hover:text-primary transition-colors">{en.course?.title}</p>
                                                    <p className="text-[9px] text-muted-foreground uppercase font-black tracking-tight mt-0.5">
                                                        {completedCount} / {lessonsCount} Lessons Completed
                                                    </p>
                                                </div>
                                                <span className="text-[10px] font-black text-primary">{pct}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary transition-all duration-1000"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="text-center py-6 text-muted-foreground text-xs italic">No active enrollments found.</div>
                                )}
                            </div>
                        </section>

                        {/* Activity Timeline */}
                        <section className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Clock size={11} className="text-primary" /> Activity Stream
                            </h3>
                            <div className="relative pl-4 space-y-6 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[1px] before:bg-border/60">
                                {learner.activityLogs?.slice(0, 10).map((log: any, idx: number) => (
                                    <div key={idx} className="relative pl-6">
                                        <div className="absolute left-[-1px] top-1.5 w-2 h-2 rounded-full bg-primary border-2 border-background z-10" />
                                        <div>
                                            <p className="text-xs font-bold leading-none">{log.action}</p>
                                            <p className="text-[10px] text-muted-foreground mt-1.5">
                                                {new Date(log.createdAt).toLocaleDateString()} at {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {(!learner.activityLogs || learner.activityLogs.length === 0) && (
                                    <div className="text-muted-foreground text-xs italic pl-2">No recent activity recorded.</div>
                                )}
                            </div>
                        </section>
                    </div>

                    <div className="p-6 border-t border-border/50 bg-background/80 backdrop-blur-sm mt-auto">
                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-secondary text-foreground rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-secondary/80 transition-all"
                        >
                            Close Insights
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

// ─────────────────────────────────────────────
// Main LearnersManager
// ─────────────────────────────────────────────
export function LearnersManager({ domain, addToast, mode = 'learners' }: { domain: string, addToast: (msg: string, type?: 'success' | 'error') => void, mode?: 'learners' | 'admins' }) {
    const [learners, setLearners] = useState<Learner[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Panel States
    const [editingLearner, setEditingLearner] = useState<any>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [resetPassword, setResetPassword] = useState('');
    const [justCreated, setJustCreated] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [validationErrors, setValidationErrors] = useState<Record<string, string | null>>({});

    // Insights Panel
    const [insightsLearner, setInsightsLearner] = useState<Learner | null>(null);
    const [isInsightsOpen, setIsInsightsOpen] = useState(false);

    // Excel Upload
    const [isUploading, setIsUploading] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadDragOver, setUploadDragOver] = useState(false);
    const excelInputRef = useRef<HTMLInputElement>(null);

    // Learner limit states
    const [learnerLimit, setLearnerLimit] = useState<number>(0);
    const [planName, setPlanName] = useState<string>('Starter');

    const isAdminsMode = mode === 'admins';
    const visibleUsers = learners.filter(user => isAdminsMode ? user.role !== 'LEARNER' : user.role === 'LEARNER');

    useEffect(() => {
        fetchData();
    }, [domain]);

    const fetchData = async () => {
        try {
            const [lRes, rRes, tRes] = await Promise.all([
                fetch(`/api/t/${domain}/learners`),
                fetch(`/api/t/${domain}/roles`),
                fetch(`/api/t/${domain}/teams`)
            ]);
            if (lRes.ok) {
                setLearners(await lRes.json());
                const limitHeader = lRes.headers.get('x-learner-limit');
                const planHeader = lRes.headers.get('x-learner-plan');
                if (limitHeader) {
                    setLearnerLimit(parseInt(limitHeader, 10));
                }
                if (planHeader) {
                    setPlanName(planHeader);
                }
            }
            if (rRes.ok) setRoles(await rRes.json());
            if (tRes.ok) setTeams(await tRes.json());
        } catch (e) {
            console.error('Fetch error', e);
        } finally {
            setLoading(false);
        }
    };

    const handleOnboard = () => {
        if (!isAdminsMode && learnerLimit > 0) {
            const currentLearnersCount = learners.filter(u => u.role === 'LEARNER').length;
            if (currentLearnersCount >= learnerLimit) {
                addToast(`Learner limit reached (${learnerLimit} users max). Please upgrade your plan (${planName}) to add more learners.`, 'error');
                return;
            }
        }
        const password = Math.random().toString(36).substring(2, 10);
        setEditingLearner({
            name: '',
            email: '',
            role: isAdminsMode ? 'TENANT_ADMIN' : 'LEARNER',
            password,
            jobRoleIds: [],
            teamIds: [],
            managedTeamIds: [],
            tenantAdminPermissions: isAdminsMode ? ALL_TENANT_ADMIN_PERMISSIONS : [],
            isCreating: true,
            domain
        });
        setJustCreated(null);
        setResetPassword('');
        setIsPanelOpen(true);
    };

    const handleEdit = (learner: Learner) => {
        setEditingLearner({
            ...learner,
            teamIds: learner.teams?.map(t => t.id) || [],
            managedTeamIds: learner.managedTeams?.map(t => t.id) || [],
            jobRoleIds: learner.jobRoles?.map(r => r.id) || [],
            tenantAdminPermissions: learner.tenantAdminPermissions || [],
            isCreating: false,
            domain
        });
        setJustCreated(null);
        setResetPassword('');
        setIsPanelOpen(true);
    };

    const handleSubmit = async (data: any) => {
        const errors: Record<string, string | null> = {};
        if (!data.name?.trim()) {
            errors.name = 'Name is required';
        }
        if (!data.email?.trim()) {
            errors.email = 'Email is required';
        } else {
            const targetEmail = data.email.trim().toLowerCase();
            const emailExists = learners.some(l => l.email.toLowerCase() === targetEmail && (data.isCreating ? true : l.id !== data.id));
            if (emailExists) {
                errors.email = isAdminsMode ? 'Admin email already exists in this workspace' : 'Learner email already exists in this workspace';
            }
        }

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }
        setValidationErrors({});

        setIsSubmitting(true);
        try {
            if (data.isCreating) {
                const res = await fetch(`/api/t/${domain}/learners`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: data.name,
                        email: data.email,
                        role: isAdminsMode ? data.role : 'LEARNER',
                        password: data.password,
                        jobRoleIds: data.jobRoleIds,
                        teamIds: data.teamIds,
                        managedTeamIds: data.managedTeamIds,
                        tenantAdminPermissions: isAdminsMode ? (data.tenantAdminPermissions || []) : []
                    })
                });
                if (res.ok) {
                    addToast('User created successfully', 'success');
                    setJustCreated({ password: data.password });
                    fetchData();
                } else {
                    const err = await res.json();
                    addToast(err.error || `Failed to create ${isAdminsMode ? 'admin' : 'learner'}`, 'error');
                }
            } else {
                const res = await fetch(`/api/t/${domain}/learners`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        learnerId: data.id,
                        name: data.name,
                        email: data.email,
                        role: isAdminsMode ? data.role : 'LEARNER',
                        jobRoleIds: data.jobRoleIds,
                        teamIds: data.teamIds,
                        managedTeamIds: data.managedTeamIds,
                        tenantAdminPermissions: isAdminsMode ? (data.tenantAdminPermissions || []) : []
                    })
                });
                if (res.ok) {
                    addToast('Profile updated', 'success');
                    setIsPanelOpen(false);
                    fetchData();
                } else {
                    const err = await res.json().catch(() => null);
                    addToast(err?.error || 'Failed to update profile', 'error');
                }
            }
        } catch (e) {
            addToast(`Unexpected error while saving ${isAdminsMode ? 'admin' : 'learner'}`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusToggle = async (learner: Learner) => {
        try {
            const res = await fetch(`/api/t/${domain}/learners`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ learnerId: learner.id, isActive: !learner.isActive })
            });
            if (res.ok) {
                fetchData();
            }
        } catch (e) { }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/t/${domain}/learners?learnerId=${id}`, { method: 'DELETE' });
            if (res.ok) {
                addToast('Learner archived', 'success');
                setIsPanelOpen(false);
                fetchData();
            }
        } catch (e) { }
    };

    const handleForceReset = async () => {
        const newPwd = Math.random().toString(36).substring(2, 10);
        try {
            const res = await fetch(`/api/t/${domain}/learners`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ learnerId: editingLearner.id, newPassword: newPwd })
            });
            if (res.ok) {
                setResetPassword(newPwd);
                addToast('Password reset successfully');
            }
        } catch (e) { }
    };

    const handleInsights = (learner: Learner) => {
        setInsightsLearner(learner);
        setIsInsightsOpen(true);
    };

    const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        if (learnerLimit > 0) {
            const currentLearnersCount = learners.filter(u => u.role === 'LEARNER').length;
            if (currentLearnersCount >= learnerLimit) {
                addToast(`Learner limit reached (${learnerLimit} users max). Please upgrade your plan (${planName}) to add more learners.`, 'error');
                return;
            }
        }

        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext !== 'xlsx' && ext !== 'xls' && ext !== 'csv') {
            addToast('Only Excel and CSV files (.xlsx, .xls, .csv) are allowed.', 'error');
            return;
        }
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const parseRes = await fetch(`/api/t/${domain}/users/parse-file`, { method: 'POST', body: formData });
            const parseData = await parseRes.json();
            if (!parseRes.ok || !parseData.users?.length) {
                addToast(parseData.error || 'No valid records found in file.', 'error');
                return;
            }
            const uploadRes = await fetch(`/api/t/${domain}/users/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ users: parseData.users })
            });
            const uploadData = await uploadRes.json();
            if (uploadRes.ok) {
                const success = uploadData.results?.filter((r: any) => r.status === 'success').length ?? parseData.users.length;
                addToast(`${success} learner(s) imported successfully!`, 'success');
                fetchData();
                setIsUploadModalOpen(false);
            } else {
                addToast(uploadData.error || 'Upload failed.', 'error');
            }
        } catch {
            addToast('Unexpected error during upload.', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const downloadSampleTemplate = () => {
        // Build CSV content directly — no xlsx needed on client side
        const headers = ['Full Name', 'Email Address', 'Assigned Roles', 'Assigned Teams'];
        const samples = [
            ['John Smith', 'john.smith@company.com', 'Developer', 'Engineering'],
            ['Sarah Johnson', 'sarah.j@company.com', 'Designer', 'Product'],
            ['Mike Chen', 'mike.chen@company.com', 'Manager', 'Operations'],
        ];
        const csvRows = [headers, ...samples].map(row =>
            row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
        );
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'learner_import_template.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="glassmorphism p-8 rounded-3xl border border-border/50">
                <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-3">
                        <Users className="text-primary w-6 h-6" />
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight">{isAdminsMode ? 'Manage Admins' : 'Learner Roster'}</h2>
                            <p className="text-sm text-muted-foreground">
                                {isAdminsMode ? 'Create admin accounts and assign domain permissions.' : 'Create and manage learner accounts only.'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {!isAdminsMode && (
                            <>
                                <input
                                    ref={excelInputRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                                    className="hidden"
                                    onChange={handleExcelUpload}
                                />
                                <button
                                    onClick={() => setIsUploadModalOpen(true)}
                                    className="px-5 py-3 bg-secondary/70 border border-border/50 text-foreground rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-secondary transition-all flex items-center gap-2"
                                >
                                    <Upload size={16} /> Upload File
                                </button>
                            </>
                        )}
                        <button
                            onClick={handleOnboard}
                            className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 flex items-center gap-2 shadow-xl shadow-primary/20"
                        >
                            <Plus size={18} /> {isAdminsMode ? 'Add admin' : 'Add learner'}
                        </button>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
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
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Talent Identity</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Role</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Progress</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Access</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                            {loading ? (
                                <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="animate-spin text-primary inline-block" /></td></tr>
                            ) : visibleUsers.filter(l =>
                            (l.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                l.email?.toLowerCase().includes(searchQuery.toLowerCase()))
                            ).length === 0 ? (
                                <tr><td colSpan={5} className="py-20 text-center text-muted-foreground text-sm italic">No matching {isAdminsMode ? 'admins' : 'learners'} found.</td></tr>
                            ) : visibleUsers
                                .filter(l =>
                                (l.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    l.email?.toLowerCase().includes(searchQuery.toLowerCase()))
                                )
                                .map(l => (
                                    <tr key={l.id} className={`hover:bg-primary/5 transition-all group ${!l.isActive ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-secondary border border-border/50 flex items-center justify-center font-black text-sm group-hover:border-primary/50 transition-colors">
                                                    {l.name?.[0]?.toUpperCase() || l.email?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div className="min-w-0">
                                                    <span className={`block font-bold text-sm truncate ${!l.isActive ? 'line-through decoration-red-500/50' : ''}`}>{l.name || 'Awaiting Setup'}</span>
                                                    <span className="text-[10px] text-muted-foreground truncate block">{l.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="w-fit rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-primary">
                                                    {l.role === 'TENANT_ADMIN' ? 'Domain Admin' : l.role.replace('_', ' ')}
                                                </span>
                                                {isAdminsMode && (
                                                    <span className="text-[9px] font-bold text-muted-foreground">
                                                        {l.tenantAdminPermissions?.length || 0}/{ALL_TENANT_ADMIN_PERMISSIONS.length} permissions
                                                    </span>
                                                )}
                                                <div className="flex flex-wrap gap-1 mt-1.5 max-w-[200px]">
                                                    {l.jobRoles && l.jobRoles.length > 0 ? l.jobRoles.map((r: any) => (
                                                        <span key={r.id} className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 flex items-center gap-1 border border-emerald-500/20">
                                                            <Briefcase size={8} /> {r.name}
                                                        </span>
                                                    )) : (
                                                        <span className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                                                            <Briefcase size={10} /> No Role Assigned
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {l.teams?.length > 0 ? l.teams.map(t => (
                                                        <span key={t.id} className="text-[9px] font-bold bg-secondary px-2 py-0.5 rounded-full border border-border/40 whitespace-nowrap">
                                                            {t.name}
                                                        </span>
                                                    )) : <span className="text-[9px] text-muted-foreground italic">Standalone Learner</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="w-32 space-y-1.5">
                                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight">
                                                    <span className="text-muted-foreground">Progress</span>
                                                    <span className="text-primary">{l._count?.enrollments || 0} Paths</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden border border-border/20">
                                                    <div className="h-full bg-primary" style={{ width: '45%' }} /> {/* Placeholder progress */}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 cursor-pointer" onClick={() => handleStatusToggle(l)}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-8 h-4 rounded-full p-0.5 transition-all relative ${l.isActive ? 'bg-emerald-500' : 'bg-secondary border border-border/40'}`}>
                                                    <div className={`w-3 h-3 rounded-full shadow-sm transition-all bg-white ${l.isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                    {l.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleInsights(l)}
                                                    className="p-2 rounded-xl bg-secondary/50 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                                                    title="View Learner Insights"
                                                >
                                                    <BarChart3 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(l)}
                                                    className="p-2 rounded-xl bg-secondary/50 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                                                    title="Edit Profile"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <LearnerSlideOver
                isOpen={isPanelOpen}
                onClose={() => setIsPanelOpen(false)}
                learner={editingLearner}
                isCreating={editingLearner?.isCreating}
                mode={mode}
                roles={roles.map(r => ({ id: r.id, name: r.name, description: r.description }))}
                teams={teams.map(t => ({ id: t.id, name: t.name, email: '' }))} // Transforming teams to match Person interface for multi-select
                onSubmit={handleSubmit}
                onDelete={handleDelete}
                justCreated={justCreated}
                resetPassword={resetPassword}
                onResetPassword={handleForceReset}
                isSubmitting={isSubmitting}
                validationErrors={validationErrors}
                setValidationErrors={setValidationErrors}
            />
            <LearnerInsightsSlideOver
                isOpen={isInsightsOpen}
                onClose={() => setIsInsightsOpen(false)}
                learner={insightsLearner}
            />

            {/* ── Upload File Modal ── */}
            {isUploadModalOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-[390] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => !isUploading && setIsUploadModalOpen(false)}
                    />
                    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 pointer-events-none">
                        <div className="pointer-events-auto w-full max-w-lg max-h-[90vh] flex flex-col bg-background border border-border/60 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">

                            {/* Header */}
                            <div className="flex items-start justify-between px-8 py-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Upload className="text-primary w-4 h-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bulk Import</p>
                                    </div>
                                    <h2 className="text-xl font-black">Upload Learners</h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">Import multiple learners at once from an Excel file</p>
                                </div>
                                <button
                                    onClick={() => !isUploading && setIsUploadModalOpen(false)}
                                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-8 py-7 space-y-6">
                                {/* Drop / Click Zone */}
                                <label
                                    htmlFor="modal-excel-input"
                                    onDragOver={(e) => { e.preventDefault(); setUploadDragOver(true); }}
                                    onDragLeave={() => setUploadDragOver(false)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setUploadDragOver(false);
                                        const file = e.dataTransfer.files?.[0];
                                        if (file) {
                                            const syntheticEvent = { target: { files: [file], value: '' } } as any;
                                            handleExcelUpload(syntheticEvent);
                                        }
                                    }}
                                    className={`flex flex-col items-center justify-center gap-4 w-full rounded-2xl border-2 border-dashed py-10 cursor-pointer transition-all ${
                                        isUploading
                                            ? 'border-primary/40 bg-primary/5 cursor-not-allowed'
                                            : uploadDragOver
                                            ? 'border-primary bg-primary/10 scale-[1.01]'
                                            : 'border-border/50 bg-secondary/20 hover:border-primary/50 hover:bg-primary/5'
                                    }`}
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 size={36} className="text-primary animate-spin" />
                                            <div className="text-center">
                                                <p className="text-sm font-bold">Processing file...</p>
                                                <p className="text-xs text-muted-foreground mt-1">Please wait while we import your learners</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                                <FileSpreadsheet size={28} className="text-emerald-400" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-bold">Drop your Excel or CSV file here</p>
                                                <p className="text-xs text-muted-foreground mt-1">or click to browse — <span className="text-emerald-400 font-bold">.xlsx / .xls / .csv only</span></p>
                                            </div>
                                        </>
                                    )}
                                    <input
                                        id="modal-excel-input"
                                        type="file"
                                        accept=".xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                                        className="hidden"
                                        disabled={isUploading}
                                        onChange={handleExcelUpload}
                                    />
                                </label>

                                {/* Sample Template Section */}
                                <div className="rounded-2xl border border-border/40 bg-secondary/10 overflow-hidden">
                                    <div className="px-5 py-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Sample Template</p>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">Use this format for your Excel file</p>
                                        </div>
                                        <button
                                            onClick={downloadSampleTemplate}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[11px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all"
                                        >
                                            <Download size={13} /> Download
                                        </button>
                                    </div>
                                </div>

                                {/* Cancel */}
                                <button
                                    onClick={() => setIsUploadModalOpen(false)}
                                    disabled={isUploading}
                                    className="w-full py-3 bg-secondary/50 text-foreground rounded-xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-40"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
