'use client';

import { useState, useEffect } from 'react';
import { 
    BarChart3, 
    Calendar,
    Filter,
    ArrowUpRight,
    Users,
    HardDrive,
    Bot,
    Building2,
    DollarSign,
    BookOpen
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface ReportData {
    kpis: {
        totalTenants: number;
        activeTenants: number;
        totalUsers: number;
        totalRevenue: number;
        totalStorageMB: number;
        totalAiCreditsAllocated: number;
        transcriptionsUsed: number;
        totalCourses: number;
    };
    charts: {
        usersByRole: { name: string; value: number }[];
        userRegistrationTrend: { date: string; users: number }[];
    };
    leaderboards: {
        topTenantsByRevenue: { name: string; revenue: number; currency: string }[];
        topTenantsByUsers: { name: string; users: number }[];
    };
}

const getCurrencySymbol = (currencyCode?: string) => {
    switch (currencyCode) {
        case 'EUR': return '€';
        case 'GBP': return '£';
        case 'INR': return '₹';
        case 'USD': default: return '$';
    }
};

const COLORS = ['#3b82f6', '#8b5cf6', '#a855f7', '#10b981', '#f59e0b'];

export default function ReportsPage() {
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [tenants, setTenants] = useState<{ id: string, name: string }[]>([]);
    
    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [tenantId, setTenantId] = useState('');

    useEffect(() => {
        // Fetch tenants for the filter dropdown ONCE
        async function loadTenants() {
            try {
                const res = await fetch('/api/admin/tenants');
                const t = await res.json();
                setTenants(t.map((x: any) => ({ id: x.id, name: x.name })));
            } catch (e) {
                console.error(e);
            }
        }
        loadTenants();
    }, []);

    useEffect(() => {
        async function fetchReport() {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (startDate) params.append('startDate', startDate);
                if (endDate) params.append('endDate', endDate);
                if (tenantId) params.append('tenantId', tenantId);

                const res = await fetch(`/api/admin/reports?${params.toString()}`);
                const rData = await res.json();
                setData(rData);
            } catch (e) {
                console.error("Failed to load reports", e);
            } finally {
                setLoading(false);
            }
        }

        fetchReport();
    }, [startDate, endDate, tenantId]);

    const StatCard = ({ title, value, icon: Icon, format = 'number', description, renderChildren }: any) => {
        const formattedValue = format === 'currency' 
            ? `$${value?.toLocaleString() || 0}`
            : format === 'mb' 
                ? `${value?.toLocaleString() || 0} MB`
                : value?.toLocaleString() || 0;

        return (
            <div className="glassmorphism p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-blue-500/20 transition-colors">
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{title}</p>
                        {renderChildren ? renderChildren : (
                            <h3 className="text-3xl font-black">{formattedValue}</h3>
                        )}
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                    </div>
                </div>
                {description && (
                    <p className="text-xs font-medium text-muted-foreground mt-4 relative z-10 hidden sm:block">
                        {description}
                    </p>
                )}
                <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500">
                    <Icon className="w-32 h-32" />
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 md:p-8 space-y-8 pb-32">
            
            {/* Header & Filters */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                    <h1 className="text-2xl font-black tracking-tight uppercase flex items-center gap-3">
                        <BarChart3 className="w-7 h-7 text-blue-500" /> Platform Insights
                    </h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Aggregated analytics and operational data across all workspaces.</p>
                </div>

                <div className="glassmorphism rounded-xl border border-white/5 p-2 flex flex-col md:flex-row items-center gap-4 text-sm w-full xl:w-auto overflow-x-auto">
                    <div className="flex items-center gap-2 pl-2 text-muted-foreground font-bold shrink-0">
                        <Filter className="w-4 h-4" /> Filters:
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <input 
                            type="date" 
                            className="bg-secondary/50 border border-white/5 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <span className="text-muted-foreground">to</span>
                        <input 
                            type="date" 
                            className="bg-secondary/50 border border-white/5 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    
                    <div className="h-6 w-px bg-white/10 hidden md:block" />

                    <select 
                        className="bg-[#0f0f1a] text-white border border-white/10 rounded-lg px-4 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
                        value={tenantId}
                        onChange={(e) => setTenantId(e.target.value)}
                        style={{ colorScheme: 'dark' }}
                    >
                        <option value="" className="bg-[#0f0f1a] text-white">All Workspaces</option>
                        {tenants.map(t => (
                            <option key={t.id} value={t.id} className="bg-[#0f0f1a] text-white">{t.name}</option>
                        ))}
                    </select>

                    {(startDate || endDate || tenantId) && (
                        <button 
                            onClick={() => { setStartDate(''); setEndDate(''); setTenantId(''); }}
                            className="text-xs font-bold text-red-400 hover:text-red-300 px-3 whitespace-nowrap"
                        >
                            CLEAR FILTERS
                        </button>
                    )}
                </div>
            </div>

            {loading || !data ? (
                <div className="flex items-center justify-center py-32">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                    
                    {/* Top KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        <StatCard 
                            title="Total MRR (Offline Tracking)" 
                            value={data.kpis.totalRevenue}
                            icon={DollarSign} 
                            format="currency"
                            description="Cumulative recurring revenue monitored cross-platform."
                        />
                        <StatCard 
                            title="Platform Users" 
                            value={data.kpis.totalUsers} 
                            icon={Users} 
                            description="Learners, teachers, and admins combined."
                        />
                        <StatCard 
                            title="Total Data Resourced" 
                            value={data.kpis.totalStorageMB} 
                            icon={HardDrive} 
                            format="mb"
                            description="Aggregated file bandwidth spanning all active deployed tenants."
                        />
                        <StatCard 
                            title="AI API Consumption" 
                            value={data.kpis.transcriptionsUsed} 
                            icon={Bot} 
                            description={`Total processing cycles executed vs ${data.kpis.totalAiCreditsAllocated} allocated pool limit.`}
                        />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <div className="glassmorphism p-6 rounded-2xl border border-white/10 w-full overflow-hidden">
                            <h3 className="font-bold mb-6 tracking-tight flex items-center gap-2">Platform Adoption Velocity</h3>
                            {data.charts.userRegistrationTrend.length > 0 ? (
                                <div className="h-64 sm:h-72 lg:h-80 w-full min-w-0" style={{ position: 'relative' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data.charts.userRegistrationTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                            <XAxis dataKey="date" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#09090b', borderRadius: '12px', borderColor: '#ffffff20' }}
                                                cursor={{ fill: '#ffffff05' }}
                                            />
                                            <Bar dataKey="users" name="New User Records" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-48 w-full flex items-center justify-center text-muted-foreground italic">No historical trend data found for parameters.</div>
                            )}
                        </div>

                        <div className="glassmorphism p-6 rounded-2xl border border-white/10">
                            <h3 className="font-bold mb-6 tracking-tight flex items-center gap-2">Global Access Distribution</h3>
                            {data.charts.usersByRole.length > 0 ? (
                                <div className="h-64 sm:h-72 lg:h-80 w-full min-w-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data.charts.usersByRole}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {data.charts.usersByRole.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#09090b', borderRadius: '12px', borderColor: '#ffffff20' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="flex justify-center gap-4 mt-2 flex-wrap">
                                        {data.charts.usersByRole.map((role, i) => (
                                            <div key={role.name} className="flex items-center gap-2 text-xs font-medium">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                                {role.name} ({role.value})
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-48 w-full flex items-center justify-center text-muted-foreground italic">Insufficient volume data available to generate distribution logic model.</div>
                            )}
                        </div>
                    </div>

                    {!tenantId && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="glassmorphism p-6 rounded-2xl border border-white/10">
                                <h3 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground"><DollarSign className="w-4 h-4 text-green-400" /> Revenue Leaders</h3>
                                <div className="space-y-4">
                                    {data.leaderboards.topTenantsByRevenue.map((t, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-secondary/20 p-3 rounded-xl">
                                            <span className="font-bold flex items-center gap-2">
                                                <span className="text-muted-foreground">#{idx + 1}</span> 
                                                {t.name}
                                            </span>
                                            <span className="font-mono font-bold text-green-400">{getCurrencySymbol(t.currency)}{t.revenue?.toLocaleString() || 0}</span>
                                        </div>
                                    ))}
                                    {data.leaderboards.topTenantsByRevenue.length === 0 && (
                                        <div className="text-center py-6 text-sm text-muted-foreground italic">Zero active ledgers monitored</div>
                                    )}
                                </div>
                            </div>

                            <div className="glassmorphism p-6 rounded-2xl border border-white/10">
                                <h3 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground"><Building2 className="w-4 h-4 text-blue-400" /> Top by Headcount</h3>
                                <div className="space-y-4">
                                    {data.leaderboards.topTenantsByUsers.map((t, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-secondary/20 p-3 rounded-xl">
                                            <span className="font-bold flex items-center gap-2">
                                                <span className="text-muted-foreground">#{idx + 1}</span> 
                                                {t.name}
                                            </span>
                                            <span className="font-mono font-bold">{t.users?.toLocaleString() || 0}</span>
                                        </div>
                                    ))}
                                    {data.leaderboards.topTenantsByUsers.length === 0 && (
                                        <div className="text-center py-6 text-sm text-muted-foreground italic">No headcount data active</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
}
