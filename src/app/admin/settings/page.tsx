'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, UploadCloud, Link as LinkIcon, AlertCircle, Bot, Palette, Globe, Upload, Plus, Trash2, LayoutDashboard } from 'lucide-react';
import Image from 'next/image';
import { uploadFile } from '@/lib/upload';

export default function GlobalSettingsPage() {
    const [settings, setSettings] = useState<Record<string, string>>({
        maxUploadSize: '10',
        supportEmail: 'support@lebra.ai',
        PLATFORM_NAME: 'Lebra.Ai',
        PLATFORM_PRIMARY_COLOR: '#3b82f6'
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'general' | 'branding'>('general');
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

    useEffect(() => {
        fetch('/api/admin/settings')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const map: Record<string, string> = {};
                    data.forEach((item: any) => {
                        map[item.key] = item.value;
                    });
                    if (Object.keys(map).length > 0) {
                        setSettings(prev => ({ ...prev, ...map }));
                    }
                }
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, []);

    const handleSave = async (key: string, value: string) => {
        setIsSaving(key);
        try {
            await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value })
            });
            // Show brief success state could go here
        } catch (error) {
            console.error(error);
        }
        setIsSaving(null);
    };

    const handleChange = (key: string, val: string) => {
        setSettings(prev => ({ ...prev, [key]: val }));
    };

    const handleFileUpload = async (file: File, key: string) => {
        setUploadProgress(prev => ({ ...prev, [key]: 0 }));
        try {
            const data = await uploadFile(file, { tenantId: 'system', courseId: 'branding' }, (p) => {
                setUploadProgress(prev => ({ ...prev, [key]: p }));
            });
            handleSave(key, data.url);
            setSettings(prev => ({ ...prev, [key]: data.url }));
        } catch (error) {
            console.error(error);
        } finally {
            setUploadProgress(prev => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 h-full flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <Settings className="w-8 h-8 text-indigo-500 animate-spin" />
                    <p className="font-bold text-muted-foreground">Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
            <div className="flex justify-between items-center bg-indigo-500/10 p-6 rounded-3xl border border-indigo-500/20">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-black tracking-tight uppercase flex items-center gap-3">
                        <Settings className="w-8 h-8 text-indigo-500" />
                        Platform Management
                    </h1>
                    <p className="text-muted-foreground text-sm font-medium">
                        Configure global limits, branding, and system-wide integrations.
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1.5 bg-secondary/30 rounded-2xl w-fit border border-border/50">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'general' ? 'bg-background text-foreground shadow-xl border border-border/50' : 'text-muted-foreground hover:text-foreground'}`}>
                    <LayoutDashboard size={14} /> General
                </button>
                <button
                    onClick={() => setActiveTab('branding')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'branding' ? 'bg-background text-foreground shadow-xl border border-border/50' : 'text-muted-foreground hover:text-foreground'}`}>
                    <Palette size={14} /> Branding
                </button>
            </div>

            {activeTab === 'general' ? (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                    {/* Max Upload Size */}
                    <div className="glassmorphism p-6 rounded-2xl border border-border/50 flex flex-col md:flex-row gap-6 md:items-center justify-between transition-all hover:border-indigo-500/50">
                        <div>
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <UploadCloud className="w-5 h-5 text-blue-400" /> Max Upload Size (MB)
                            </h3>
                            <p className="text-sm text-muted-foreground max-w-sm mt-1">
                                The maximum file size any tenant admin or learner can upload per asset.
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <input
                                type="number"
                                className="bg-background border border-input rounded-xl px-4 py-2 w-32 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                value={settings.maxUploadSize || ''}
                                onChange={(e) => handleChange('maxUploadSize', e.target.value)}
                            />
                            <button
                                onClick={() => handleSave('maxUploadSize', settings.maxUploadSize)}
                                disabled={isSaving === 'maxUploadSize'}
                                className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20 active:scale-95"
                            >
                                <Save className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Support Email */}
                    <div className="glassmorphism p-6 rounded-2xl border border-border/50 flex flex-col md:flex-row gap-6 md:items-center justify-between transition-all hover:border-emerald-500/50">
                        <div>
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <LinkIcon className="w-5 h-5 text-emerald-400" /> Global Support Email
                            </h3>
                            <p className="text-sm text-muted-foreground max-w-sm mt-1">
                                Where generic platform-wide support requests are routed.
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <input
                                type="email"
                                className="bg-background border border-input rounded-xl px-4 py-2 w-64 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                value={settings.supportEmail || ''}
                                onChange={(e) => handleChange('supportEmail', e.target.value)}
                            />
                            <button
                                onClick={() => handleSave('supportEmail', settings.supportEmail)}
                                disabled={isSaving === 'supportEmail'}
                                className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20 active:scale-95"
                            >
                                <Save className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* API Keys */}
                    <div className="glassmorphism p-6 rounded-2xl border border-border/50 flex flex-col gap-6 transition-all hover:border-blue-500/50">
                        <div>
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <UploadCloud className="w-5 h-5 text-blue-400" /> AI Integrations
                            </h3>
                            <p className="text-sm text-muted-foreground mr-16 mt-1">
                                Configure the self-hosted Whisper Lambda service. When a Tenant Admin uploads an MP4 video, the system fires a background job to your Lambda which transcribes the audio and sends results back automatically.
                            </p>
                        </div>

                        {/* Whisper Lambda URL */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Whisper Lambda URL (API Gateway)</label>
                            <div className="flex items-center gap-4 w-full">
                                <input
                                    type="text"
                                    placeholder="https://xxxxxx.execute-api.ap-south-1.amazonaws.com/transcribe"
                                    className="bg-background border border-input rounded-xl px-4 py-2 flex-grow focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm"
                                    value={settings.WHISPER_LAMBDA_URL || ''}
                                    onChange={(e) => handleChange('WHISPER_LAMBDA_URL', e.target.value)}
                                />
                                <button
                                    onClick={() => handleSave('WHISPER_LAMBDA_URL', settings.WHISPER_LAMBDA_URL)}
                                    disabled={isSaving === 'WHISPER_LAMBDA_URL'}
                                    className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20 active:scale-95 shrink-0"
                                >
                                    <Save className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-[11px] text-muted-foreground">Deploy the <code className="bg-secondary px-1 rounded">whisper-service/</code> Docker container to AWS Lambda and paste the API Gateway endpoint URL here.</p>
                        </div>

                        <hr className="border-border/30 my-4" />

                        {/* Chatbot API URL */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Bot className="w-4 h-4 text-emerald-400" /> Proprietary Chatbot API Endpoint
                            </label>
                            <div className="flex items-center gap-4 w-full">
                                <input
                                    type="text"
                                    placeholder="https://your-proprietary-llm-cluster.com/api/chat"
                                    className="bg-background border border-input rounded-xl px-4 py-2 flex-grow focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono text-sm"
                                    value={settings.CHATBOT_API_URL || ''}
                                    onChange={(e) => handleChange('CHATBOT_API_URL', e.target.value)}
                                />
                                <button
                                    onClick={() => handleSave('CHATBOT_API_URL', settings.CHATBOT_API_URL)}
                                    disabled={isSaving === 'CHATBOT_API_URL'}
                                    className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20 active:scale-95 shrink-0"
                                >
                                    <Save className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-[11px] text-muted-foreground">The HTTP POST URL for your self-hosted LLM (e.g. AWS Bedrock, LLaMA-3 EC2 Instance). The backend will send securely stripped `{"{prompt, system_context, role}"}` JSON payloads here.</p>
                        </div>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-4 text-amber-500">
                        <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
                        <p className="text-sm font-medium">Changes made here apply instantly across all tenant workspaces. Make sure not to set limits that break existing workflows.</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Identity & Color */}
                        <div className="glassmorphism p-8 rounded-3xl border border-border/50 space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-500 flex items-center gap-2">
                                    <Globe size={14} /> Platform Identity
                                </h3>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Universal Site Name</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={settings.PLATFORM_NAME || ''}
                                            onChange={e => handleChange('PLATFORM_NAME', e.target.value)}
                                            className="flex-1 bg-secondary/50 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-bold"
                                            placeholder="e.g. Lebra.Ai"
                                        />
                                        <button
                                            onClick={() => handleSave('PLATFORM_NAME', settings.PLATFORM_NAME)}
                                            disabled={isSaving === 'PLATFORM_NAME'}
                                            className="px-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                                        >
                                            <Save size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-500 flex items-center gap-2">
                                    <Palette size={14} /> Global Theme Color
                                </h3>
                                <div className="flex items-center gap-6 p-4 rounded-2xl bg-secondary/20 border border-border/30">
                                    <div className="relative group">
                                        <input
                                            type="color"
                                            value={settings.PLATFORM_PRIMARY_COLOR || '#3b82f6'}
                                            onChange={e => {
                                                handleChange('PLATFORM_PRIMARY_COLOR', e.target.value);
                                                handleSave('PLATFORM_PRIMARY_COLOR', e.target.value);
                                            }}
                                            className="w-16 h-16 rounded-2xl cursor-pointer border-4 border-background bg-transparent shadow-xl transition-transform active:scale-95"
                                        />
                                        <div className="absolute inset-0 rounded-2xl ring-2 ring-indigo-500/20 pointer-events-none" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black mb-1">Brand Token</p>
                                        <p className="font-mono font-black text-xl text-foreground tracking-tighter">{settings.PLATFORM_PRIMARY_COLOR?.toUpperCase() || '#3B82F6'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2.5 flex-wrap">
                                    {['#3b82f6', '#8b5cf6', '#ef4444', '#10b981', '#f59e0b', '#ec4899', '#14b8a6', '#000000'].map(c => (
                                        <button
                                            key={c}
                                            className={`w-9 h-9 rounded-xl border-2 transition-all hover:scale-110 shadow-sm ${settings.PLATFORM_PRIMARY_COLOR === c ? 'scale-110 shadow-lg shadow-black/20' : 'opacity-80 hover:opacity-100'}`}
                                            style={{ backgroundColor: c, borderColor: settings.PLATFORM_PRIMARY_COLOR === c ? 'white' : 'transparent' }}
                                            onClick={() => {
                                                handleChange('PLATFORM_PRIMARY_COLOR', c);
                                                handleSave('PLATFORM_PRIMARY_COLOR', c);
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Brand Assets */}
                        <div className="glassmorphism p-8 rounded-3xl border border-border/50 space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-500 flex items-center gap-2">
                                <UploadCloud size={14} /> Master Brand Assets
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { id: 'PLATFORM_LOGO_PRIMARY', label: 'Primary Logo', sub: 'Standard Wide' },
                                    { id: 'PLATFORM_LOGO_LIGHT', label: 'Light Logo', sub: 'For Dark Backgrounds' },
                                    { id: 'PLATFORM_LOGO_DARK', label: 'Dark Logo', sub: 'For Light Backgrounds' },
                                    { id: 'PLATFORM_FAVICON', label: 'Platform Favicon', sub: 'Browser Tab Icon' },
                                ].map((asset) => (
                                    <div key={asset.id} className="space-y-3 p-4 bg-secondary/20 rounded-2xl border border-border/30 group">
                                        <div className="px-1">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-foreground">{asset.label}</p>
                                            <p className="text-[8px] text-muted-foreground font-medium">{asset.sub}</p>
                                        </div>

                                        <div className="relative aspect-[3/1] rounded-xl border border-dashed border-border/60 overflow-hidden flex items-center justify-center bg-background/50 group-hover:border-indigo-500/50 transition-colors">
                                            {settings[asset.id] ? (
                                                <>
                                                    <img src={settings[asset.id]} alt={asset.label} className="max-w-[80%] max-h-[80%] object-contain p-2" />
                                                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleFileUpload(file, asset.id);
                                                        }} />
                                                        <Upload size={20} className="text-white" />
                                                    </label>
                                                </>
                                            ) : (
                                                <label className="inset-0 absolute flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-indigo-500/5 transition-all text-muted-foreground hover:text-indigo-400">
                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleFileUpload(file, asset.id);
                                                    }} />
                                                    <Plus size={16} />
                                                    <span className="text-[8px] font-black uppercase">Upload</span>
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
