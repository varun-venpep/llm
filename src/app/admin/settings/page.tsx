'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, UploadCloud, Link as LinkIcon, AlertCircle } from 'lucide-react';

export default function GlobalSettingsPage() {
    const [settings, setSettings] = useState<Record<string, string>>({
        maxUploadSize: '10',
        supportEmail: 'support@infinitelms.com'
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState<string | null>(null);

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
                        Global Platform Settings
                    </h1>
                    <p className="text-muted-foreground text-sm font-medium">
                        Configure system-wide limits, defaults, and integrations.
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Max Upload Size */}
                <div className="glassmorphism p-6 rounded-2xl border border-border/50 flex flex-col md:flex-row gap-6 md:items-center justify-between transition-all hover:border-indigo-500/50">
                    <div>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <UploadCloud className="w-5 h-5 text-blue-400" /> Max Upload Size (MB)
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-sm mt-1">
                            The maximum file size any tenant admin or student can upload per asset.
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
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-4 text-amber-500">
                    <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">Changes made here apply instantly across all tenant workspaces. Make sure not to set limits that break existing workflows.</p>
                </div>
            </div>
        </div>
    );
}
