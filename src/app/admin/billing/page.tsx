'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Sparkles, Plus, Edit2, Trash2, CheckCircle, X, Check, Loader2, Coins, Users } from 'lucide-react';

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
                confirmButton: 'px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-xl shadow-emerald-500/20 cursor-pointer font-sans'
            },
            buttonsStyling: false
        });
    } else {
        alert(`${title}: ${text}`);
    }
};

export default function BillingPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null);

    // Form states
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formCurrency, setFormCurrency] = useState('SGD');
    const [formPrice, setFormPrice] = useState('799');
    const [isCustomPrice, setIsCustomPrice] = useState(false);
    const [formNote, setFormNote] = useState('per workspace / month');
    const [formFeatures, setFormFeatures] = useState('');
    const [formUserLimit, setFormUserLimit] = useState(500);
    const [isUnlimitedUsers, setIsUnlimitedUsers] = useState(false);
    const [formCourseLimit, setFormCourseLimit] = useState(5);
    const [isUnlimitedCourses, setIsUnlimitedCourses] = useState(false);
    const [formAiQuiz, setFormAiQuiz] = useState(false);
    const [formFeatured, setFormFeatured] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await fetch('/api/admin/billing/plans');
            if (res.ok) {
                const data = await res.ok ? await res.json() : [];
                setPlans(data);
            }
        } catch (err) {
            console.error('Error fetching plans:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const openAddModal = () => {
        setEditingPlan(null);
        setFormName('');
        setFormDescription('');
        setFormCurrency('SGD');
        setFormPrice('799');
        setIsCustomPrice(false);
        setFormNote('per workspace / month');
        setFormFeatures('Up to 500 learners\nCourse builder\nBasic analytics\nStandard certificates\nEmail support');
        setFormUserLimit(500);
        setIsUnlimitedUsers(false);
        setFormCourseLimit(5);
        setIsUnlimitedCourses(false);
        setFormAiQuiz(false);
        setFormFeatured(false);
        setIsModalOpen(true);
    };

    const openEditModal = (plan: Plan) => {
        setEditingPlan(plan);
        setFormName(plan.name);
        setFormDescription(plan.description);
        setFormCurrency(plan.currency || 'SGD');
        setFormPrice(plan.price);
        setIsCustomPrice(plan.price.toLowerCase() === 'custom');
        setFormNote(plan.note);
        setFormFeatures(plan.features.join('\n'));
        setFormUserLimit(plan.userLimit);
        setIsUnlimitedUsers(plan.userLimit === 0);
        setFormCourseLimit(plan.courseCreateLimit);
        setIsUnlimitedCourses(plan.courseCreateLimit === 0);
        setFormAiQuiz(plan.aiQuizGeneration);
        setFormFeatured(plan.featured);
        setIsModalOpen(true);
    };

    const handleSavePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const newPlan: Plan = {
            id: editingPlan ? editingPlan.id : formName.toLowerCase().replace(/\s+/g, '-'),
            name: formName,
            description: formDescription,
            currency: isCustomPrice ? '' : formCurrency,
            price: isCustomPrice ? 'Custom' : formPrice,
            note: formNote,
            features: formFeatures.split('\n').map(f => f.trim()).filter(Boolean),
            userLimit: isUnlimitedUsers ? 0 : formUserLimit,
            courseCreateLimit: isUnlimitedCourses ? 0 : formCourseLimit,
            aiQuizGeneration: formAiQuiz,
            featured: formFeatured
        };

        let updatedPlans: Plan[] = [];
        if (editingPlan) {
            updatedPlans = plans.map(p => p.id === editingPlan.id ? newPlan : p);
        } else {
            // Check duplicate id/name
            if (plans.some(p => p.id === newPlan.id)) {
                setIsSaving(false);
                void showSwal('Duplicate Plan', 'A plan with this name already exists.', 'error');
                return;
            }
            updatedPlans = [...plans, newPlan];
        }

        // If this plan is set to featured, make all others not featured
        if (formFeatured) {
            updatedPlans = updatedPlans.map(p => p.id === newPlan.id ? p : { ...p, featured: false });
        }

        try {
            const res = await fetch('/api/admin/billing/plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedPlans)
            });

            if (res.ok) {
                setPlans(updatedPlans);
                setIsModalOpen(false);
                void showSwal('Success', 'Subscription plans updated successfully!', 'success');
            } else {
                void showSwal('Error', 'Failed to update subscription plans.', 'error');
            }
        } catch (err) {
            console.error('Error saving plans:', err);
            void showSwal('Error', 'An unexpected error occurred.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = (plan: Plan) => {
        if (plans.length <= 1) {
            void showSwal('Action Denied', 'You must keep at least one subscription plan.', 'warning');
            return;
        }
        setDeletingPlan(plan);
    };

    const confirmDeletePlan = async () => {
        if (!deletingPlan) return;
        const updatedPlans = plans.filter(p => p.id !== deletingPlan.id);

        try {
            const res = await fetch('/api/admin/billing/plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedPlans)
            });

            if (res.ok) {
                setPlans(updatedPlans);
                setDeletingPlan(null);
                void showSwal('Deleted', 'Plan deleted successfully!', 'success');
            } else {
                void showSwal('Error', 'Failed to update plans after deletion.', 'error');
            }
        } catch (err) {
            console.error('Error deleting plan:', err);
            void showSwal('Error', 'An unexpected error occurred.', 'error');
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-black tracking-tight uppercase flex items-center gap-2">
                        <CreditCard className="w-6 h-6 text-emerald-500" />
                        Billing & Infrastructure Plans
                    </h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Manage platform monetization, Stripe integrations, and subscription tier limits.</p>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={openAddModal}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                    >
                        <Plus className="w-4 h-4" /> Add Subscription Plan
                    </button>
                </div>
            </div>

            {/* Plan Engine Overview */}
            <div className="glassmorphism p-8 rounded-3xl border border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-400" /> Subscription Engine
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md">Dynamically control restrictions and templates applied to customer workspaces.</p>
                </div>

                <div className="grid grid-cols-3 gap-4 md:min-w-[450px]">
                    <div className="p-4 rounded-2xl bg-secondary/20 border border-border/40 text-center">
                        <div className="text-2xl font-black font-mono text-emerald-400">{plans.length}</div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Total Plans</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-secondary/20 border border-border/40 text-center">
                        <div className="text-2xl font-black font-mono text-indigo-400">
                            {plans.filter(p => p.aiQuizGeneration).length}
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold mt-1">AI Enabled</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-secondary/20 border border-border/40 text-center">
                        <div className="text-2xl font-black font-mono text-purple-400">
                            {plans.some(p => p.featured) ? 'Active' : 'None'}
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Featured Banner</div>
                    </div>
                </div>
            </div>

            {/* Dynamic Plans List */}
            <div className="space-y-6">
                <div>
                    <h2 className="text-lg font-bold">Workspace Subscription Plans</h2>
                    <p className="text-muted-foreground text-xs mt-1">Below are the tiers available to tenant workspaces. The pricing landing pages sync directly with this dynamic configuration.</p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    </div>
                ) : (
                    <div className="grid md:grid-cols-3 gap-8">
                        {plans.map((plan) => (
                            <div 
                                key={plan.id} 
                                className={`relative flex flex-col rounded-3xl p-8 border bg-background transition-all duration-300 ${
                                    plan.featured 
                                        ? 'border-2 border-emerald-500/80 shadow-[0_25px_60px_-20px_rgba(16,185,129,0.15)] md:scale-[1.02]' 
                                        : 'border-border/50 hover:border-border'
                                }`}
                            >
                                {plan.featured && (
                                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-4 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-500/20">
                                        Most Popular
                                    </span>
                                )}

                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-xl font-bold">{plan.name}</h3>
                                    <div className="flex gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => openEditModal(plan)}
                                            className="p-1.5 hover:bg-secondary rounded-lg border border-transparent hover:border-border transition-all text-blue-400"
                                            title="Edit Tier"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteClick(plan)}
                                            className="p-1.5 hover:bg-red-500/10 rounded-lg border border-transparent hover:border-red-500/20 transition-all text-red-400"
                                            title="Delete Tier"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                <p className="text-xs text-muted-foreground min-h-[40px] mb-6">{plan.description}</p>

                                <div className="mb-6 pb-6 border-b border-border/40">
                                    <div className="flex items-baseline gap-1">
                                        {plan.price !== 'Custom' && (
                                            <span className="text-lg font-bold text-muted-foreground mr-1">{plan.currency}</span>
                                        )}
                                        <span className="text-4xl font-extrabold tracking-tight">
                                            {plan.price}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground/80 mt-1.5 italic">{plan.note}</p>
                                </div>

                                {/* Limits Grid */}
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="p-3 rounded-xl bg-secondary/20 border border-border/30 flex items-center gap-2">
                                        <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <div>
                                            <div className="text-[9px] text-muted-foreground uppercase font-bold">Learner Limit</div>
                                            <div className="text-xs font-bold font-mono">
                                                {plan.userLimit === 0 ? 'Unlimited' : `${plan.userLimit} Users`}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-xl bg-secondary/20 border border-border/30 flex items-center gap-2">
                                        <Coins className="w-4 h-4 text-indigo-400 shrink-0" />
                                        <div>
                                            <div className="text-[9px] text-muted-foreground uppercase font-bold">Course Limit</div>
                                            <div className="text-xs font-bold font-mono">
                                                {plan.courseCreateLimit === 0 ? 'Unlimited' : `${plan.courseCreateLimit} Courses`}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-2 p-3 rounded-xl bg-secondary/20 border border-border/30 flex items-center gap-2 justify-between">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold">AI Quiz Generation</span>
                                        </div>
                                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                            plan.aiQuizGeneration 
                                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                                                : 'bg-secondary text-muted-foreground'
                                        }`}>
                                            {plan.aiQuizGeneration ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </div>
                                </div>

                                {/* Features List */}
                                <ul className="space-y-3 mt-auto">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-2.5 text-xs text-foreground/90">
                                            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                                                <Check className="h-2.5 w-2.5 text-emerald-400" strokeWidth={3} />
                                            </span>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-background border border-border w-full max-w-xl max-h-[calc(100vh-2rem)] rounded-3xl shadow-2xl p-6 sm:p-8 my-auto space-y-6 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-emerald-500" />
                                {editingPlan ? 'Configure Subscription Plan' : 'Create New Subscription Plan'}
                            </h3>
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="p-1.5 hover:bg-secondary rounded-lg border border-transparent hover:border-border text-muted-foreground hover:text-foreground transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSavePlan} className="space-y-5">
                            {/* Plan Name */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Plan Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Starter, Professional, Growth"
                                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-foreground font-bold"
                                    value={formName}
                                    onChange={e => setFormName(e.target.value)}
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Description</label>
                                <textarea
                                    rows={2}
                                    required
                                    placeholder="Brief plan summary seen by users..."
                                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-foreground"
                                    value={formDescription}
                                    onChange={e => setFormDescription(e.target.value)}
                                />
                            </div>

                            {/* Price and Currency */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center justify-between">
                                        <span>Cost/Price</span>
                                        <label className="flex items-center gap-1 cursor-pointer select-none normal-case tracking-normal">
                                            <input 
                                                type="checkbox" 
                                                className="rounded border-border bg-secondary text-emerald-500 focus:ring-0 w-3 h-3" 
                                                checked={isCustomPrice}
                                                onChange={e => {
                                                    setIsCustomPrice(e.target.checked);
                                                    if (e.target.checked) setFormPrice('Custom');
                                                }}
                                            />
                                            <span className="text-[9px] text-muted-foreground">Custom/Quote</span>
                                        </label>
                                    </label>
                                    <div className="flex bg-secondary/50 border border-border rounded-xl overflow-hidden">
                                        {!isCustomPrice && (
                                            <select
                                                className="bg-secondary pl-3 pr-1 py-3 text-xs focus:outline-none font-bold border-r border-border text-foreground"
                                                value={formCurrency}
                                                onChange={e => setFormCurrency(e.target.value)}
                                            >
                                                <option value="SGD">SGD</option>
                                                <option value="USD">USD</option>
                                                <option value="EUR">EUR</option>
                                                <option value="GBP">GBP</option>
                                                <option value="INR">INR</option>
                                            </select>
                                        )}
                                        <input
                                            type="text"
                                            required
                                            disabled={isCustomPrice}
                                            placeholder="e.g. 799"
                                            className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-bold"
                                            value={formPrice}
                                            onChange={e => setFormPrice(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Price Note</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. per workspace / month"
                                        className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-foreground"
                                        value={formNote}
                                        onChange={e => setFormNote(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Plan Limits */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/20 rounded-2xl border border-border/30">
                                {/* Learner/User Limit */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                        <span>Learner Limit</span>
                                        <label className="flex items-center gap-1 cursor-pointer select-none normal-case tracking-normal">
                                            <input 
                                                type="checkbox" 
                                                className="rounded border-border bg-secondary text-emerald-500 focus:ring-0 w-3 h-3" 
                                                checked={isUnlimitedUsers}
                                                onChange={e => setIsUnlimitedUsers(e.target.checked)}
                                            />
                                            <span className="text-[8px] text-muted-foreground">Unlimited</span>
                                        </label>
                                    </label>
                                    <input
                                        type="number"
                                        disabled={isUnlimitedUsers}
                                        min="1"
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-mono disabled:opacity-40"
                                        value={isUnlimitedUsers ? '' : formUserLimit}
                                        onChange={e => setFormUserLimit(parseInt(e.target.value) || 0)}
                                    />
                                </div>

                                {/* Course Create Limit */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                        <span>Course Limit</span>
                                        <label className="flex items-center gap-1 cursor-pointer select-none normal-case tracking-normal">
                                            <input 
                                                type="checkbox" 
                                                className="rounded border-border bg-secondary text-emerald-500 focus:ring-0 w-3 h-3" 
                                                checked={isUnlimitedCourses}
                                                onChange={e => setIsUnlimitedCourses(e.target.checked)}
                                            />
                                            <span className="text-[8px] text-muted-foreground">Unlimited</span>
                                        </label>
                                    </label>
                                    <input
                                        type="number"
                                        disabled={isUnlimitedCourses}
                                        min="1"
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-mono disabled:opacity-40"
                                        value={isUnlimitedCourses ? '' : formCourseLimit}
                                        onChange={e => setFormCourseLimit(parseInt(e.target.value) || 0)}
                                    />
                                </div>

                                {/* AI Quiz toggle */}
                                <div className="col-span-2 flex items-center justify-between border-t border-border/30 pt-3 mt-1">
                                    <div>
                                        <div className="text-[10px] font-bold text-foreground">AI Quiz Generation</div>
                                        <div className="text-[8px] text-muted-foreground">Allow dynamic quiz creation using AI modules</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormAiQuiz(!formAiQuiz)}
                                        className={`w-10 h-6 rounded-full p-0.5 transition-all flex items-center ${
                                            formAiQuiz ? 'bg-emerald-500 border-emerald-500' : 'bg-zinc-800 border-zinc-700'
                                        } border`}
                                    >
                                        <div className={`w-4 h-4 rounded-full shadow-sm transition-all ${
                                            formAiQuiz ? 'bg-white translate-x-4' : 'bg-zinc-400 translate-x-0'
                                        }`} />
                                    </button>
                                </div>
                            </div>

                            {/* Features list text area */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Plan Features Checklist (One per line)</label>
                                <textarea
                                    rows={4}
                                    required
                                    placeholder="e.g.&#10;Up to 500 learners&#10;Course builder&#10;Basic analytics"
                                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-foreground font-mono leading-relaxed"
                                    value={formFeatures}
                                    onChange={e => setFormFeatures(e.target.value)}
                                />
                            </div>

                            {/* Options */}
                            <div className="flex items-center gap-3 p-4 bg-secondary/20 rounded-2xl border border-border/30 cursor-pointer" onClick={() => setFormFeatured(!formFeatured)}>
                                <button
                                    type="button"
                                    className={`w-10 h-6 rounded-full p-0.5 transition-all flex items-center ${formFeatured ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-secondary border-border/50'} border`}
                                >
                                    <div className={`w-4 h-4 rounded-full shadow-sm transition-all ${formFeatured ? 'bg-emerald-500 translate-x-4' : 'bg-muted-foreground translate-x-0'}`} />
                                </button>
                                <div>
                                    <div className="text-[10px] font-bold text-foreground">Featured / Most Popular Plan</div>
                                    <div className="text-[8px] text-muted-foreground">Renders with a highlight outline and badge on the pricing page</div>
                                </div>
                            </div>

                            {/* Action Button */}
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2 group"
                            >
                                {isSaving ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving Configuration...</>
                                ) : (
                                    <>Save Tier Configuration <Check className="w-4 h-4 group-hover:scale-110 transition-transform" /></>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Custom Delete Confirmation Modal */}
            {deletingPlan && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="swal2-popup swal2-modal rounded-[2rem] border border-border bg-background text-foreground shadow-2xl p-8 swal2-icon-warning swal2-show w-full max-w-sm space-y-6 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
                        {/* Exclamation Circle */}
                        <div className="swal2-icon swal2-warning swal2-icon-show w-20 h-20 rounded-full border-2 border-amber-500/80 flex items-center justify-center text-amber-500 text-4xl font-light">
                            !
                        </div>

                        {/* Text Details */}
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold tracking-tight text-white">Delete Subscription Plan?</h3>
                            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                                Are you sure you want to permanently delete the <strong className="text-white">{deletingPlan.name}</strong> subscription plan? Workspaces using this plan may be affected.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 w-full pt-2">
                            <button
                                onClick={confirmDeletePlan}
                                className="flex-1 py-3 px-6 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-red-600/20"
                            >
                                Confirm Delete
                            </button>
                            <button
                                onClick={() => setDeletingPlan(null)}
                                className="flex-1 py-3 px-6 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
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
