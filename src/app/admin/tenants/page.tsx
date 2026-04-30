'use client';

import { useState, useEffect } from 'react';
import { Search, MoreVertical, Building2, CheckCircle2, ShieldCheck, Edit2, Trash2, AlertTriangle, Loader2, ExternalLink, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { ALL_TENANT_ADMIN_PERMISSIONS, TENANT_ADMIN_PERMISSIONS } from '@/lib/permissions';

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
    adminEmail?: string;
    aiCredits?: number;
    customRevenue?: number;
    customRevenueCurrency?: string;
    globalMarketplaceEnabled?: boolean;
    courseCredits?: number;
    tenantAdminPermissions?: string[];
}

const getCurrencySymbol = (currencyCode?: string) => {
    switch (currencyCode) {
        case 'EUR': return '€';
        case 'GBP': return '£';
        case 'INR': return '₹';
        case 'USD': default: return '$';
    }
};

const getTenantAdminAccess = (permissions?: string[]) => {
    const knownPermissions = new Set(TENANT_ADMIN_PERMISSIONS.map(permission => permission.key));
    const enabledPermissions = permissions?.length
        ? permissions.filter(permission => knownPermissions.has(permission))
        : ALL_TENANT_ADMIN_PERMISSIONS;
    const enabledLabels = TENANT_ADMIN_PERMISSIONS
        .filter(permission => enabledPermissions.includes(permission.key))
        .map(permission => permission.label);

    return {
        enabledCount: enabledPermissions.length,
        isRestricted: enabledPermissions.length < ALL_TENANT_ADMIN_PERMISSIONS.length,
        title: enabledLabels.length ? enabledLabels.join(', ') : 'No tenant admin permissions enabled'
    };
};

export default function TenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
    const [editForm, setEditForm] = useState({
        name: '',
        subdomain: '',
        isActive: true,
        adminEmail: '',
        newPassword: '',
        aiCredits: 0,
        customRevenue: 0,
        customRevenueCurrency: 'USD',
        globalMarketplaceEnabled: false,
        courseCredits: 0,
        tenantAdminPermissions: ALL_TENANT_ADMIN_PERMISSIONS
    });
    const [isUpdating, setIsUpdating] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchTenants = async () => {
        try {
            const res = await fetch('/api/admin/tenants', { cache: 'no-store' });
            const data = await res.json();
            setTenants(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void Promise.resolve().then(fetchTenants);

        // Close dropdown when clicking outside
        const handleClickOutside = () => setActiveDropdown(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const handleEditClick = (tenant: Tenant) => {
        setEditingTenant(tenant);
        setEditForm({
            name: tenant.name,
            subdomain: tenant.subdomain,
            isActive: tenant.isActive,
            adminEmail: tenant.adminEmail || '',
            newPassword: '',
            aiCredits: tenant.aiCredits || 0,
            customRevenue: tenant.customRevenue || 0,
            customRevenueCurrency: tenant.customRevenueCurrency || 'USD',
            globalMarketplaceEnabled: tenant.globalMarketplaceEnabled || false,
            courseCredits: tenant.courseCredits || 0,
            tenantAdminPermissions: tenant.tenantAdminPermissions?.length ? tenant.tenantAdminPermissions : ALL_TENANT_ADMIN_PERMISSIONS
        });
        setIsEditModalOpen(true);
        setActiveDropdown(null);
    };

    const toggleTenantAdminPermission = (permission: string) => {
        setEditForm(prev => ({
            ...prev,
            tenantAdminPermissions: prev.tenantAdminPermissions.includes(permission)
                ? prev.tenantAdminPermissions.filter(item => item !== permission)
                : [...prev.tenantAdminPermissions, permission]
        }));
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
                setEditForm(prev => ({ ...prev, newPassword: '' }));
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
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Financials</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Admin Access</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Created</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground text-right px-10">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {loading ? (
                                <tr><td colSpan={8} className="text-center py-20 font-medium text-muted-foreground italic">Syncing with cloud...</td></tr>
                            ) : tenants.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-20 font-medium text-muted-foreground italic">No active deployments found.</td></tr>
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
                                            <span className="font-mono text-[10px] text-muted-foreground uppercase">{tenant.aiCredits || 0} AI Credits</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-mono text-xs font-bold">
                                                {getCurrencySymbol(tenant.customRevenueCurrency)}{tenant.customRevenue?.toLocaleString() || '0'}/mo
                                            </span>
                                            <span className="font-mono text-[10px] text-muted-foreground uppercase">Revenue</span>
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
                                    <td className="px-6 py-4">
                                        {(() => {
                                            const access = getTenantAdminAccess(tenant.tenantAdminPermissions);

                                            if (tenant.subdomain === 'admin-system') {
                                                return (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold uppercase">
                                                        <ShieldCheck className="w-3 h-3" /> Core Admin
                                                    </span>
                                                );
                                            }

                                            return (
                                                <div className="flex flex-col gap-1" title={access.title}>
                                                    <span className={`inline-flex w-fit items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase ${access.isRestricted ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                                                        {access.isRestricted ? 'Restricted' : 'Full access'}
                                                    </span>
                                                    <span className="font-mono text-[10px] text-muted-foreground uppercase">
                                                        {access.enabledCount}/{ALL_TENANT_ADMIN_PERMISSIONS.length} permissions
                                                    </span>
                                                </div>
                                            );
                                        })()}
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
                <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto p-4 sm:p-6 bg-black/70 backdrop-blur-sm">
                    <div className="bg-background border border-border w-full max-w-lg max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] rounded-3xl shadow-2xl p-6 sm:p-8 my-auto space-y-6 overflow-y-auto">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2"><Edit2 className="w-5 h-5 text-blue-400" /> Edit Workspace</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-muted-foreground hover:text-foreground text-2xl">&times;</button>
                        </div>

                        <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-6 md:col-span-2">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Organization Name</label>
                                    <input
                                        type="text"
                                        className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Subdomain</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-mono disabled:opacity-50"
                                        value={editForm.subdomain}
                                        onChange={e => setEditForm({ ...editForm, subdomain: e.target.value })}
                                        disabled={editingTenant?.subdomain === 'admin-system'}
                                        required
                                    />
                                </div>
                                {editForm.subdomain && (
                                    <div className="flex items-center justify-between px-1">
                                        <div className="text-[10px] text-blue-400 font-mono flex items-center gap-1.5 overflow-hidden">
                                            <span className="truncate">http://{editForm.subdomain}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'lvh.me:3000'}/login</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const url = `http://${editForm.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'lvh.me:3000'}/login`;
                                                if (navigator.clipboard) {
                                                    navigator.clipboard.writeText(url);
                                                } else {
                                                    // Fallback for non-secure contexts
                                                    const textArea = document.createElement("textarea");
                                                    textArea.value = url;
                                                    document.body.appendChild(textArea);
                                                    textArea.select();
                                                    try {
                                                        document.execCommand('copy');
                                                    } catch (err) {
                                                        console.error('Fallback copy failed', err);
                                                    }
                                                    document.body.removeChild(textArea);
                                                }
                                                setCopied(true);
                                                setTimeout(() => setCopied(false), 2000);
                                            }}
                                            className="text-[10px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 whitespace-nowrap transition-colors"
                                        >
                                            {copied ? <><Check className="w-3 h-3 text-emerald-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy URL</>}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Admin Email Address</label>
                                <input
                                    type="email"
                                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                    value={editForm.adminEmail}
                                    onChange={e => setEditForm({ ...editForm, adminEmail: e.target.value })}
                                    required
                                    placeholder="admin@workspace.com"
                                />
                            </div>

                            <div className="space-y-1.5 md:col-span-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Change Admin Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                        value={editForm.newPassword}
                                        onChange={e => setEditForm({ ...editForm, newPassword: e.target.value })}
                                        placeholder="Enter new password..."
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <p className="text-[9px] text-muted-foreground italic px-1 pt-1">Leave blank to keep current password.</p>
                            </div>

                            <div className="space-y-1.5 md:col-span-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">AI Transcription Credits</label>
                                <input
                                    type="number"
                                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                    value={editForm.aiCredits || ''}
                                    onChange={e => setEditForm({ ...editForm, aiCredits: parseInt(e.target.value) || 0 })}
                                    placeholder="0"
                                />
                                <p className="text-[9px] text-muted-foreground italic px-1 pt-1">Total whisper-service credits for this tenant.</p>
                            </div>

                            <div className="space-y-1.5 md:col-span-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Monthly Costing</label>
                                <div className="flex bg-secondary/50 border border-border rounded-xl">
                                    <select
                                        className="bg-transparent pl-4 pr-2 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 rounded-l-xl font-medium border-r border-border"
                                        value={editForm.customRevenueCurrency}
                                        onChange={e => setEditForm({ ...editForm, customRevenueCurrency: e.target.value })}
                                    >
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                        <option value="INR">INR (₹)</option>
                                    </select>
                                    <input
                                        type="number"
                                        className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 rounded-r-xl"
                                        value={editForm.customRevenue || ''}
                                        onChange={e => setEditForm({ ...editForm, customRevenue: parseInt(e.target.value) || 0 })}
                                        placeholder="0"
                                    />
                                </div>
                                <p className="text-[9px] text-muted-foreground italic px-1 pt-1">Offline costing/value tracked against this workspace.</p>
                            </div>

                            <div className="flex flex-col gap-3 justify-end pb-1.5">
                                <a
                                    href={`http://${editForm.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'lvh.me:3000'}/login`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-[11px] font-bold bg-secondary hover:bg-secondary/70 border border-border rounded-xl transition-all uppercase tracking-wider group"
                                >
                                    Visit Workspace <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </a>
                            </div>

                            <div className="md:col-span-2 space-y-4 pt-2">
                                {/* Global Marketplace Toggle */}
                                <div className="md:col-span-2 space-y-3 pt-2 border-t border-border/50">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Global Marketplace</p>
                                    <div
                                        className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${editForm.globalMarketplaceEnabled ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-secondary/20 border-border/50'}`}
                                        onClick={() => editingTenant?.subdomain !== 'admin-system' && setEditForm({ ...editForm, globalMarketplaceEnabled: !editForm.globalMarketplaceEnabled })}
                                    >
                                        <div>
                                            <p className="text-sm font-bold">Enable Global Course Marketplace</p>
                                            <p className="text-[10px] text-muted-foreground">Allow this workspace to discover and claim global courses</p>
                                        </div>
                                        <div className={`w-10 h-6 rounded-full p-1 flex items-center transition-all ${editForm.globalMarketplaceEnabled ? 'bg-indigo-500' : 'bg-secondary'}`}>
                                            <div className={`w-4 h-4 rounded-full bg-white shadow transition-all ${editForm.globalMarketplaceEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                        </div>
                                    </div>
                                    {editForm.globalMarketplaceEnabled && (
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Course Credits</label>
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                                value={editForm.courseCredits || ''}
                                                onChange={e => setEditForm({ ...editForm, courseCredits: parseInt(e.target.value) || 0 })}
                                                placeholder="0"
                                            />
                                            <p className="text-[9px] text-muted-foreground italic px-1">Each claim costs 1 credit. Set to 0 to restrict access temporarily.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Workspace Status Toggle */}
                                <div className="md:col-span-2 space-y-3 pt-2 border-t border-border/50">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tenant Admin Permissions</p>
                                            <p className="text-[10px] text-muted-foreground">Controls what this workspace admin can access.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setEditForm(prev => ({ ...prev, tenantAdminPermissions: ALL_TENANT_ADMIN_PERMISSIONS }))}
                                            className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:underline"
                                        >
                                            Select All
                                        </button>
                                    </div>
                                    <div className="grid gap-2 md:grid-cols-2">
                                        {TENANT_ADMIN_PERMISSIONS.map(permission => {
                                            const isEnabled = editForm.tenantAdminPermissions.includes(permission.key);

                                            return (
                                                <button
                                                    key={permission.key}
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={isEnabled}
                                                    onClick={() => toggleTenantAdminPermission(permission.key)}
                                                    className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-border/40 bg-secondary/20 p-3 text-left transition-colors hover:bg-secondary/30"
                                                >
                                                    <span className="min-w-0">
                                                        <span className="block text-[11px] font-bold">{permission.label}</span>
                                                        <span className="block text-[9px] text-muted-foreground">{permission.description}</span>
                                                    </span>
                                                    <span className={`flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-all ${isEnabled ? 'bg-blue-500' : 'bg-secondary'}`}>
                                                        <span className={`h-4 w-4 rounded-full bg-white shadow transition-all ${isEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-secondary/20 rounded-2xl border border-border/50 group cursor-pointer hover:bg-secondary/30 transition-all md:col-span-2" onClick={() => editingTenant?.subdomain !== 'admin-system' && setEditForm({ ...editForm, isActive: !editForm.isActive })}>
                                    <div className={`w-10 h-6 rounded-full p-1 transition-all flex items-center ${editForm.isActive ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-red-500/20 border-red-500/40'} border`}>
                                        <div className={`w-4 h-4 rounded-full shadow-sm transition-all ${editForm.isActive ? 'bg-emerald-500 translate-x-4' : 'bg-red-500 translate-x-0'}`} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold">Workspace Status</span>
                                        <span className="text-[10px] text-muted-foreground uppercase font-black">{editForm.isActive ? 'Active & Online' : 'Inactive & Offline'}</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={editForm.isActive}
                                        onChange={e => setEditForm({ ...editForm, isActive: e.target.checked })}
                                        disabled={editingTenant?.subdomain === 'admin-system'}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2 group"
                                >
                                    {isUpdating ? <><Loader2 className="w-4 h-4 animate-spin" /> Syncing Changes...</> : <>Save Workspace Configuration <Check className="w-4 h-4 group-hover:scale-110 transition-transform" /></>}
                                </button>
                            </div>
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
