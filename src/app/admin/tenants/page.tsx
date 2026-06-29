'use client';

import { useState, useEffect } from 'react';
import { Search, MoreVertical, Building2, CheckCircle2, ShieldCheck, Edit2, Trash2, AlertTriangle, Loader2, ExternalLink, Copy, Check, Eye, EyeOff, Plus } from 'lucide-react';

interface Plan {
    id: string;
    name: string;
    description: string;
    currency: string;
    price: string;
    note: string;
    features: string[];
    userLimit: number;
    courseCreateLimit: number;
    aiQuizGeneration: boolean;
    featured: boolean;
}

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
    courseCreateCount?: number;
}

const getCurrencySymbol = (currencyCode?: string) => {
    switch (currencyCode) {
        case 'EUR': return '€';
        case 'GBP': return '£';
        case 'INR': return '₹';
        case 'USD': default: return '$';
    }
};

const showSwal = async (title: string, text: string, icon: 'success' | 'error' | 'warning' | 'info') => {
    if (typeof window === 'undefined') return;
    const win = window as any;
    if (!win.Swal) {
        // Load CSS
        if (!document.getElementById('sweetalert2-css')) {
            const link = document.createElement('link');
            link.id = 'sweetalert2-css';
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css';
            document.head.appendChild(link);
        }
        // Load JS
        await new Promise<void>((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11';
            script.onload = () => resolve();
            script.onerror = () => resolve();
            document.body.appendChild(script);
        });
    }
    if (win.Swal) {
        return win.Swal.fire({
            title,
            text,
            icon,
            background: 'var(--background)',
            color: 'var(--foreground)',
            customClass: {
                popup: 'rounded-[2rem] border border-border bg-background text-foreground shadow-2xl p-8',
                title: 'text-lg font-black uppercase tracking-tight text-foreground !m-0 !pt-2 font-sans',
                htmlContainer: 'text-sm text-muted-foreground font-medium !mt-2 !mb-6 font-sans',
                confirmButton: 'px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-xl shadow-blue-500/20 cursor-pointer font-sans'
            },
            buttonsStyling: false
        });
    } else {
        alert(`${title}: ${text}`);
    }
};

type EditForm = {
    name: string;
    subdomain: string;
    isActive: boolean;
    adminEmail: string;
    newPassword: string;
    aiCredits: number;
    customRevenue: number;
    customRevenueCurrency: string;
    globalMarketplaceEnabled: boolean;
    courseCredits: number;
    courseCreateCount: number;
};

export default function TenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTenants = tenants.filter(tenant => 
        tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        tenant.subdomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tenant.adminEmail && tenant.adminEmail.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const getValidationError = (key: string): string | null => {
        return validationErrors[key] || null;
    };

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
    const [editForm, setEditForm] = useState<EditForm>({
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
        courseCreateCount: 0,
    });
    const [isUpdating, setIsUpdating] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '',
        subdomain: '',
        adminEmail: '',
        adminPassword: '',
                globalMarketplaceEnabled: false,
        courseCredits: 0,
        courseCreateCount: 0,
        selectedPlanId: '',
    });
    const [showCreatePassword, setShowCreatePassword] = useState(false);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationErrors({});
        const errors: Record<string, string> = {};

        if (!createForm.name.trim()) {
            errors.name = 'Organization name is required';
        }
        if (!createForm.subdomain.trim()) {
            errors.subdomain = 'Subdomain is required';
        }
        if (!createForm.adminEmail.trim()) {
            errors.adminEmail = 'Admin email address is required';
        }
        if (!createForm.adminPassword.trim()) {
            errors.adminPassword = 'Admin password is required';
        }

        // Check for duplicate name
        if (createForm.name.trim()) {
            const nameExists = tenants.some(t => t.name.trim().toLowerCase() === createForm.name.trim().toLowerCase());
            if (nameExists) {
                errors.name = 'Organization name already exists';
            }
        }

        // Check for duplicate subdomain
        if (createForm.subdomain.trim()) {
            const subdomainExists = tenants.some(t => t.subdomain.trim().toLowerCase() === createForm.subdomain.trim().toLowerCase());
            if (subdomainExists) {
                errors.subdomain = 'Subdomain already exists';
            }
        }

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        setIsCreating(true);
        try {
            const res = await fetch('/api/admin/tenants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(createForm)
            });
            if (res.ok) {
                await fetchTenants();
                setIsCreateModalOpen(false);
                setCreateForm({
                    name: '',
                    subdomain: '',
                    adminEmail: '',
                    adminPassword: '',
                    globalMarketplaceEnabled: false,
                    courseCredits: 0,
                    courseCreateCount: 0,
                    selectedPlanId: '',
                });
                setValidationErrors({});
                showSwal('Success', 'Workspace created successfully!', 'success');
            } else {
                const data = await res.json();
                showSwal('Error', data.error || 'Failed to create tenant', 'error');
            }
        } catch (err) {
            console.error(err);
            showSwal('Error', 'An error occurred', 'error');
        } finally {
            setIsCreating(false);
        }
    };

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

    const fetchPlans = async () => {
        try {
            const res = await fetch('/api/admin/billing/plans');
            if (res.ok) {
                const data = await res.json();
                setPlans(data);
            }
        } catch (err) {
            console.error('Failed to fetch plans:', err);
        }
    };

    useEffect(() => {
        void Promise.resolve().then(fetchTenants);
        void Promise.resolve().then(fetchPlans);

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
            courseCreateCount: tenant.courseCreateCount || 0,
        });
        setValidationErrors({});
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

        setValidationErrors({});
        const errors: Record<string, string> = {};

        if (!editForm.name.trim()) {
            errors.name = 'Organization name is required';
        }
        if (!editForm.subdomain.trim()) {
            errors.subdomain = 'Subdomain is required';
        }
        if (!editForm.adminEmail.trim()) {
            errors.adminEmail = 'Admin email address is required';
        }

        // Check for duplicate name
        if (editForm.name.trim()) {
            const nameExists = tenants.some(t => t.name.trim().toLowerCase() === editForm.name.trim().toLowerCase() && t.id !== editingTenant.id);
            if (nameExists) {
                errors.name = 'Organization name already exists';
            }
        }

        // Check for duplicate subdomain
        if (editForm.subdomain.trim()) {
            const subdomainExists = tenants.some(t => t.subdomain.trim().toLowerCase() === editForm.subdomain.trim().toLowerCase() && t.id !== editingTenant.id);
            if (subdomainExists) {
                errors.subdomain = 'Subdomain already exists';
            }
        }

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

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
                setValidationErrors({});
                showSwal('Success', 'Workspace updated successfully!', 'success');
            } else {
                const data = await res.json();
                showSwal('Error', data.error || 'Failed to update tenant', 'error');
            }
        } catch (err) {
            console.error(err);
            showSwal('Error', 'An error occurred', 'error');
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
                showSwal('Success', 'Workspace deleted successfully!', 'success');
            } else {
                const data = await res.json();
                showSwal('Error', data.error || 'Failed to delete tenant', 'error');
            }
        } catch (err) {
            console.error(err);
            showSwal('Error', 'An error occurred', 'error');
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
                <button
                    onClick={() => {
                        setCreateForm({
                            name: '',
                            subdomain: '',
                            adminEmail: '',
                            adminPassword: '',
                            globalMarketplaceEnabled: false,
                            courseCredits: 0,
                            courseCreateCount: 0,
                            selectedPlanId: '',
                        });
                        setValidationErrors({});
                        setIsCreateModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-xl shadow-blue-500/20 group"
                >
                    <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" /> Create Tenant
                </button>
            </div>

            <div className="glassmorphism rounded-2xl overflow-hidden border border-border/50">
                <div className="p-6 border-b border-border/50 flex justify-between items-center bg-secondary/20">
                    <h2 className="font-bold flex items-center gap-2"><Building2 className="w-5 h-5 text-blue-500" /> All Deployments</h2>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search organizations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
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
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Created</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground text-right px-10">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {loading ? (
                                <tr><td colSpan={7} className="text-center py-20 font-medium text-muted-foreground italic">Syncing with cloud...</td></tr>
                            ) : tenants.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-20 font-medium text-muted-foreground italic">No active deployments found.</td></tr>
                            ) : filteredTenants.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-20 font-medium text-muted-foreground italic">No matching workspaces found.</td></tr>
                            ) : filteredTenants.map((tenant) => (
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
                    <div className="bg-background border border-border w-full max-w-2xl max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] rounded-3xl shadow-2xl p-6 sm:p-8 my-auto space-y-6 overflow-y-auto">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2"><Edit2 className="w-5 h-5 text-blue-400" /> Edit Workspace</h3>
                            <button onClick={() => { setIsEditModalOpen(false); setValidationErrors({}); }} className="text-muted-foreground hover:text-foreground text-2xl">&times;</button>
                        </div>

                        <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6" noValidate>
                            <div className="space-y-6 md:col-span-2">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Organization Name</label>
                                    <input
                                        type="text"
                                        className={`w-full bg-secondary/50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all ${
                                            getValidationError('name') ? 'border-red-500/50 focus:ring-red-500/30' : 'border-border focus:ring-blue-500/30'
                                        }`}
                                        value={editForm.name}
                                        onChange={e => {
                                            setEditForm({ ...editForm, name: e.target.value });
                                            if (getValidationError('name')) {
                                                setValidationErrors(prev => ({ ...prev, name: '' }));
                                            }
                                        }}
                                        required
                                    />
                                    {getValidationError('name') && (
                                        <p className="text-[11px] font-bold text-red-500 animate-in fade-in slide-in-from-top-1 ml-1 uppercase tracking-wider">
                                            {getValidationError('name')}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Subdomain</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        className={`w-full bg-secondary/50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 font-mono disabled:opacity-50 transition-all ${
                                            getValidationError('subdomain') ? 'border-red-500/50 focus:ring-red-500/30' : 'border-border focus:ring-blue-500/30'
                                        }`}
                                        value={editForm.subdomain}
                                        onChange={e => {
                                            setEditForm({ ...editForm, subdomain: e.target.value });
                                            if (getValidationError('subdomain')) {
                                                setValidationErrors(prev => ({ ...prev, subdomain: '' }));
                                            }
                                        }}
                                        disabled={editingTenant?.subdomain === 'admin-system'}
                                        required
                                    />
                                </div>
                                {getValidationError('subdomain') && (
                                    <p className="text-[11px] font-bold text-red-500 animate-in fade-in slide-in-from-top-1 ml-1 uppercase tracking-wider">
                                        {getValidationError('subdomain')}
                                    </p>
                                )}
                                {editForm.subdomain && !getValidationError('subdomain') && (
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
                                    className={`w-full bg-secondary/50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all ${
                                        getValidationError('adminEmail') ? 'border-red-500/50 focus:ring-red-500/30' : 'border-border focus:ring-blue-500/30'
                                    }`}
                                    value={editForm.adminEmail}
                                    onChange={e => {
                                        setEditForm({ ...editForm, adminEmail: e.target.value });
                                        if (getValidationError('adminEmail')) {
                                            setValidationErrors(prev => ({ ...prev, adminEmail: '' }));
                                        }
                                    }}
                                    required
                                    placeholder="admin@workspace.com"
                                />
                                {getValidationError('adminEmail') && (
                                    <p className="text-[11px] font-bold text-red-500 animate-in fade-in slide-in-from-top-1 ml-1 uppercase tracking-wider">
                                        {getValidationError('adminEmail')}
                                    </p>
                                )}
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
                                        className="bg-secondary pl-4 pr-2 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 rounded-l-xl font-medium border-r border-border text-foreground"
                                        value={editForm.customRevenueCurrency}
                                        onChange={e => setEditForm({ ...editForm, customRevenueCurrency: e.target.value })}
                                    >
                                        <option value="USD" className="bg-[#0A0A0A] text-foreground">USD ($)</option>
                                        <option value="EUR" className="bg-[#0A0A0A] text-foreground">EUR (€)</option>
                                        <option value="GBP" className="bg-[#0A0A0A] text-foreground">GBP (£)</option>
                                        <option value="INR" className="bg-[#0A0A0A] text-foreground">INR (₹)</option>
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

                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Apply Subscription Plan Template</label>
                                <select
                                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-foreground font-bold"
                                    onChange={e => {
                                        const planId = e.target.value;
                                        const plan = plans.find(p => p.id === planId);
                                        if (plan) {
                                            setEditForm({
                                                ...editForm,
                                                courseCreateCount: plan.courseCreateLimit,
                                                aiCredits: plan.id === 'starter' ? 100 : plan.id === 'professional' ? 1000 : 9999,
                                                customRevenue: plan.price.toLowerCase() === 'custom' ? 0 : parseInt(plan.price.replace(/,/g, '')) || 0,
                                                customRevenueCurrency: plan.currency || 'USD',
                                                globalMarketplaceEnabled: plan.id !== 'starter',
                                                courseCredits: plan.id === 'professional' ? 50 : plan.id === 'enterprise' ? 9999 : 0
                                            });
                                        }
                                    }}
                                >
                                    <option value="" className="bg-[#0A0A0A] text-foreground">Apply a plan template overrides...</option>
                                    {plans.map(p => (
                                        <option key={p.id} value={p.id} className="bg-[#0A0A0A] text-foreground">
                                            {p.name} ({p.price === 'Custom' ? 'Custom Pricing' : `${p.currency} ${p.price}/mo`})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[9px] text-muted-foreground italic px-1">Selecting a template overrides limits, monthly costing, and credits automatically.</p>
                            </div>

                            <div className="space-y-1.5 md:col-span-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Course Create Limit</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                    value={editForm.courseCreateCount || ''}
                                    onChange={e => setEditForm({ ...editForm, courseCreateCount: parseInt(e.target.value) || 0 })}
                                    placeholder="0 (Unlimited)"
                                />
                                <p className="text-[9px] text-muted-foreground italic px-1 pt-1">Max courses allowed to be created. Set to 0 for unlimited.</p>
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

            {/* Create Tenant Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto p-4 sm:p-6 bg-black/70 backdrop-blur-sm">
                    <div className="bg-background border border-border w-full max-w-2xl max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] rounded-3xl shadow-2xl p-6 sm:p-8 my-auto space-y-6 overflow-y-auto">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                                <Plus className="w-5 h-5 text-emerald-400" /> Create Workspace
                            </h3>
                            <button onClick={() => { setIsCreateModalOpen(false); setValidationErrors({}); }} className="text-muted-foreground hover:text-foreground text-2xl">&times;</button>
                        </div>

                        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6" noValidate>
                            <div className="space-y-6 md:col-span-2">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Organization Name</label>
                                    <input
                                        type="text"
                                        className={`w-full bg-secondary/50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all ${
                                            getValidationError('name') ? 'border-red-500/50 focus:ring-red-500/30' : 'border-border focus:ring-blue-500/30'
                                        }`}
                                        value={createForm.name}
                                        onChange={e => {
                                            setCreateForm({ ...createForm, name: e.target.value });
                                            if (getValidationError('name')) {
                                                setValidationErrors(prev => ({ ...prev, name: '' }));
                                            }
                                        }}
                                        required
                                        placeholder="e.g. Acme Corporation"
                                    />
                                    {getValidationError('name') && (
                                        <p className="text-[11px] font-bold text-red-500 animate-in fade-in slide-in-from-top-1 ml-1 uppercase tracking-wider">
                                            {getValidationError('name')}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Subdomain</label>
                                <input
                                    type="text"
                                    className={`w-full bg-secondary/50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 font-mono transition-all ${
                                        getValidationError('subdomain') ? 'border-red-500/50 focus:ring-red-500/30' : 'border-border focus:ring-blue-500/30'
                                    }`}
                                    value={createForm.subdomain}
                                    onChange={e => {
                                        setCreateForm({ ...createForm, subdomain: e.target.value });
                                        if (getValidationError('subdomain')) {
                                            setValidationErrors(prev => ({ ...prev, subdomain: '' }));
                                        }
                                    }}
                                    required
                                    placeholder="acme"
                                />
                                {getValidationError('subdomain') && (
                                    <p className="text-[11px] font-bold text-red-500 animate-in fade-in slide-in-from-top-1 ml-1 uppercase tracking-wider">
                                        {getValidationError('subdomain')}
                                    </p>
                                )}
                                {createForm.subdomain && !getValidationError('subdomain') && (
                                    <span className="text-[9px] text-blue-400 font-mono block px-1">
                                        http://{createForm.subdomain.toLowerCase().trim()}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'lvh.me:3000'}/login
                                    </span>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Admin Email Address</label>
                                <input
                                    type="email"
                                    className={`w-full bg-secondary/50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all ${
                                        getValidationError('adminEmail') ? 'border-red-500/50 focus:ring-red-500/30' : 'border-border focus:ring-blue-500/30'
                                    }`}
                                    value={createForm.adminEmail}
                                    onChange={e => {
                                        setCreateForm({ ...createForm, adminEmail: e.target.value });
                                        if (getValidationError('adminEmail')) {
                                            setValidationErrors(prev => ({ ...prev, adminEmail: '' }));
                                        }
                                    }}
                                    required
                                    placeholder="admin@acme.com"
                                />
                                {getValidationError('adminEmail') && (
                                    <p className="text-[11px] font-bold text-red-500 animate-in fade-in slide-in-from-top-1 ml-1 uppercase tracking-wider">
                                        {getValidationError('adminEmail')}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Admin Password</label>
                                <div className="relative">
                                    <input
                                        type={showCreatePassword ? "text" : "password"}
                                        className={`w-full bg-secondary/50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all ${
                                            getValidationError('adminPassword') ? 'border-red-500/50 focus:ring-red-500/30' : 'border-border focus:ring-blue-500/30'
                                        }`}
                                        value={createForm.adminPassword}
                                        onChange={e => {
                                            setCreateForm({ ...createForm, adminPassword: e.target.value });
                                            if (getValidationError('adminPassword')) {
                                                setValidationErrors(prev => ({ ...prev, adminPassword: '' }));
                                            }
                                        }}
                                        required
                                        placeholder="Set admin password..."
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCreatePassword(!showCreatePassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                                    >
                                        {showCreatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {getValidationError('adminPassword') && (
                                    <p className="text-[11px] font-bold text-red-500 animate-in fade-in slide-in-from-top-1 ml-1 uppercase tracking-wider mt-1.5">
                                        {getValidationError('adminPassword')}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Subscription Plan Template</label>
                                <select
                                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-foreground font-bold"
                                    value={createForm.selectedPlanId || ''}
                                    onChange={e => {
                                        const planId = e.target.value;
                                        const plan = plans.find(p => p.id === planId);
                                        if (plan) {
                                            setCreateForm({
                                                ...createForm,
                                                selectedPlanId: planId,
                                                courseCreateCount: plan.courseCreateLimit,
                                                globalMarketplaceEnabled: plan.id !== 'starter',
                                                courseCredits: plan.id === 'professional' ? 50 : plan.id === 'enterprise' ? 9999 : 0
                                            });
                                        } else {
                                            setCreateForm({ ...createForm, selectedPlanId: planId });
                                        }
                                    }}
                                >
                                    <option value="" className="bg-[#0A0A0A] text-muted-foreground">Select a plan template...</option>
                                    {plans.map(p => (
                                        <option key={p.id} value={p.id} className="bg-[#0A0A0A] text-foreground">
                                            {p.name} ({p.price === 'Custom' ? 'Custom Pricing' : `${p.currency} ${p.price}/mo`})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[9px] text-muted-foreground italic px-1">Selecting a template auto-populates default workspace limits below.</p>
                            </div>

                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Course Create Limit</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                    value={createForm.courseCreateCount || ''}
                                    onChange={e => setCreateForm({ ...createForm, courseCreateCount: parseInt(e.target.value) || 0 })}
                                    placeholder="0 (Unlimited)"
                                />
                                <p className="text-[9px] text-muted-foreground italic px-1 pt-1">Maximum number of courses allowed to be created in this workspace. Set to 0 for unlimited.</p>
                            </div>

                            <div className="md:col-span-2 space-y-4 pt-2">
                                <div className="space-y-3 pt-2 border-t border-border/50">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Global Marketplace</p>
                                    <div
                                        className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${createForm.globalMarketplaceEnabled ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-secondary/20 border-border/50'}`}
                                        onClick={() => setCreateForm({ ...createForm, globalMarketplaceEnabled: !createForm.globalMarketplaceEnabled })}
                                    >
                                        <div>
                                            <p className="text-sm font-bold">Enable Global Course Marketplace</p>
                                            <p className="text-[10px] text-muted-foreground">Allow this workspace to discover and claim global courses</p>
                                        </div>
                                        <div className={`w-10 h-6 rounded-full p-1 flex items-center transition-all ${createForm.globalMarketplaceEnabled ? 'bg-indigo-500' : 'bg-secondary'}`}>
                                            <div className={`w-4 h-4 rounded-full bg-white shadow transition-all ${createForm.globalMarketplaceEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                        </div>
                                    </div>

                                </div>

                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2 group"
                                >
                                    {isCreating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating Workspace...</> : <>Create Workspace <Check className="w-4 h-4 group-hover:scale-110 transition-transform" /></>}
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
