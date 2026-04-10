'use client';

import { useState, useEffect } from 'react';
import { 
    Users, 
    ShieldCheck, 
    ShieldAlert, 
    CheckCircle2, 
    MoreVertical, 
    UserMinus, 
    UserCheck, 
    Mail, 
    Calendar,
    Loader2
} from 'lucide-react';

interface GlobalStaff {
    id: string;
    email: string;
    name: string | null;
    role: string;
    isActive: boolean;
    createdAt: string;
    tenant: {
        id: string;
        name: string;
        subdomain: string;
    };
}

export default function AdminStaffPage() {
    const [staff, setStaff] = useState<GlobalStaff[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<GlobalStaff | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    
    // Form state
    const [formData, setFormData] = useState({ email: '', name: '', role: 'PLATFORM_MANAGER', password: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchStaff();
        // Close menu on click outside
        const handleClick = () => setOpenMenuId(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users?mode=staff');
            const data = await res.json();
            if (Array.isArray(data)) {
                setStaff(data);
            }
        } catch (err) {
            console.error('Failed to fetch staff:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddOrEditStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const url = editingStaff ? `/api/admin/users/${editingStaff.id}` : '/api/admin/users';
            const method = editingStaff ? 'PATCH' : 'POST';
            
            const payload: any = { ...formData };
            if (editingStaff && !payload.password) delete payload.password; // Don't update password if empty during edit

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const data = await res.json();
            if (res.ok) {
                alert(editingStaff ? 'Staff updated successfully!' : 'Staff added successfully! Default password is password123');
                setIsModalOpen(false);
                setEditingStaff(null);
                setFormData({ email: '', name: '', role: 'PLATFORM_MANAGER', password: '' });
                fetchStaff();
            } else {
                alert(data.error || 'Failed to process request');
            }
        } catch (err) {
            alert('An error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentStatus })
            });
            if (res.ok) {
                setStaff(staff.map(s => s.id === id ? { ...s, isActive: !currentStatus } : s));
            }
        } catch (err) {
            console.error('Toggle failed:', err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to PERMANENTLY delete this staff account? This action cannot be undone.')) return;
        
        try {
            const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setStaff(staff.filter(s => s.id !== id));
            } else {
                const data = await res.json();
                alert(data.error || 'Delete failed');
            }
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    const openEditModal = (member: GlobalStaff) => {
        setEditingStaff(member);
        setFormData({ 
            email: member.email, 
            name: member.name || '', 
            role: member.role,
            password: '' // Don't show password
        });
        setIsModalOpen(true);
    };

    return (
        <div className="p-8 pb-24 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black tracking-tight uppercase flex items-center gap-3">
                        <div className="bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                            <ShieldAlert className="w-7 h-7 text-amber-500" />
                        </div>
                        Admin Master Hub
                    </h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Manage the platform owners and administrative operations team.</p>
                </div>
                <button 
                    onClick={() => {
                        setEditingStaff(null);
                        setFormData({ email: '', name: '', role: 'PLATFORM_MANAGER', password: '' });
                        setIsModalOpen(true);
                    }}
                    className="px-6 py-3 bg-white text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/90 transition-all shadow-xl shadow-white/5 flex items-center gap-2"
                >
                    <ShieldCheck className="w-4 h-4" /> Onboard Admin Master
                </button>
            </div>

            {/* Staff List Table */}
            <div className="glassmorphism rounded-3xl border border-white/5 overflow-visible shadow-2xl shadow-amber-500/5">
                <div>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-secondary/20 border-b border-white/10">
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Admin Identity</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">System Role</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Registered</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-8">
                                            <div className="h-12 bg-white/5 rounded-2xl" />
                                        </td>
                                    </tr>
                                ))
                            ) : staff.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <Users className="w-12 h-12 mx-auto text-muted-foreground/20 mb-4" />
                                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No platform staff records found</p>
                                    </td>
                                </tr>
                            ) : (
                                staff.map((member) => (
                                    <tr key={member.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-white/10 flex items-center justify-center font-black text-amber-500 text-xs">
                                                    {member.name ? member.name.substring(0, 2).toUpperCase() : member.email.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm">{member.name || 'Anonymous Admin'}</p>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                                        <Mail className="w-3 h-3" /> {member.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border tracking-widest ${
                                                member.role === 'SUPER_ADMIN' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                            }`}>
                                                {member.role.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(member.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleStatus(member.id, member.isActive !== false);
                                                    }}
                                                    className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none ${member.isActive !== false ? 'bg-emerald-500' : 'bg-white/10'}`}
                                                >
                                                    <div className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${member.isActive !== false ? 'translate-x-5' : 'translate-x-0'}`} />
                                                </button>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                    {member.isActive !== false ? 'Active' : 'Offline'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right relative overflow-visible">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuId(openMenuId === member.id ? null : member.id);
                                                }}
                                                className="p-2 hover:bg-secondary rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                                            >
                                                <MoreVertical className="w-5 h-5" />
                                            </button>
                                            
                                            {openMenuId === member.id && (
                                                <div className="absolute right-6 top-14 w-48 bg-background border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <button 
                                                        onClick={() => openEditModal(member)}
                                                        className="w-full px-4 py-3 flex items-center gap-2 text-xs font-bold hover:bg-white/5 transition-colors text-left"
                                                    >
                                                        <UserCheck className="w-4 h-4 text-blue-400" /> Edit Details
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(member.id)}
                                                        className="w-full px-4 py-3 flex items-center gap-2 text-xs font-bold hover:bg-red-500/10 text-red-400 transition-colors text-left border-t border-white/5"
                                                    >
                                                        <UserMinus className="w-4 h-4" /> Delete Account
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="glassmorphism w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-white/5 bg-gradient-to-br from-amber-600/10 to-transparent">
                            <h2 className="text-xl font-black uppercase tracking-tight">
                                {editingStaff ? 'Refine Admin Access' : 'Onboard Admin Master'}
                            </h2>
                            <p className="text-xs text-muted-foreground mt-1">
                                {editingStaff ? `Adjust records for ${editingStaff.name}` : 'Grant system-level access to the Lebra.Ai core.'}
                            </p>
                        </div>
                        <form onSubmit={handleAddOrEditStaff} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                                    <input 
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/50 transition-all font-bold"
                                        placeholder="staff@infinite.com"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
                                    <input 
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/50 transition-all font-bold"
                                        placeholder="Admin Name"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Platform Privilege</label>
                                    <select 
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22rgba(255,255,255,0.5)%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.2em] bg-[right_1rem_center] bg-no-repeat font-bold"
                                    >
                                        <option value="PLATFORM_MANAGER">Platform Manager (Tenant Creation)</option>
                                        <option value="SUPER_ADMIN">Super Admin (Full Control)</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                        {editingStaff ? 'Reset Master Password (Leave blank to keep current)' : 'Master Password'}
                                    </label>
                                    <input 
                                        type="password"
                                        required={!editingStaff}
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full bg-secondary/30 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/50 transition-all font-bold"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setEditingStaff(null);
                                    }}
                                    className="flex-1 px-6 py-4 bg-secondary/50 hover:bg-secondary rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-6 py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black shadow-lg shadow-amber-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : editingStaff ? 'Save Changes' : 'Authorize Admin'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
