'use client';

import { useState, useRef } from 'react';
import {
    X, Upload, FileText, CheckCircle2, AlertCircle,
    Download, Loader2, ChevronRight, Users, Shield,
    Briefcase, Building2, Check
} from 'lucide-react';
import Papa from 'papaparse';

interface BulkUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    domain: string;
    onSuccess: () => void;
    addToast: (msg: string, type?: 'success' | 'error') => void;
}

type Step = 'upload' | 'preview' | 'processing' | 'results';

export function BulkUploadModal({ isOpen, onClose, domain, onSuccess, addToast }: BulkUploadModalProps) {
    const [step, setStep] = useState<Step>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState<{ success: any[], errors: any[] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) processFile(selectedFile);
    };

    const processFile = (file: File) => {
        setFile(file);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results: any) => {
                setParsedData(results.data);
                setStep('preview');
            },
            error: (err: any) => {
                addToast('Failed to parse CSV: ' + err.message, 'error');
            }
        });
    };

    const downloadTemplate = () => {
        const headers = ['Name', 'Email', 'Role', 'Teams', 'Designation', 'Department'];
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\n" +
            "John Doe,john@example.com,Learner,\"Marketing, Sales\",Manager,Growth\n" +
            "Jane Smith,jane@example.com,Manager,\"HR\",Lead,People Operations";

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "bulk_talent_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUpload = async () => {
        setIsProcessing(true);
        setStep('processing');

        try {
            const response = await fetch(`/api/t/${domain}/users/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ users: parsedData })
            });

            const data = await response.json();

            if (response.ok) {
                const success = data.results.filter((r: any) => r.status === 'success');
                const errors = data.results.filter((r: any) => r.status === 'error');
                setResults({ success, errors });
                setStep('results');
                onSuccess();
            } else {
                addToast(data.error || 'Bulk upload failed', 'error');
                setStep('preview');
            }
        } catch (err) {
            addToast('Unexpected error during upload', 'error');
            setStep('preview');
        } finally {
            setIsProcessing(false);
        }
    };

    const downloadPasswords = () => {
        if (!results) return;
        const headers = ['Name', 'Email', 'Role', 'Temporary Password'];
        const rows = results.success.map(u => [u.name, u.email, u.role, u.password]);

        const csvContent = Papa.unparse({ fields: headers, data: rows });
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Credentials_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />

            <div className="relative w-full max-w-4xl bg-background border border-border/60 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="px-8 py-6 border-b border-border/40 flex justify-between items-center bg-gradient-to-r from-primary/5 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Upload className="text-primary w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight">Bulk Talent Onboarding</h2>
                            <p className="text-xs text-muted-foreground">Provision multiple identities with automated team assignments.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    {step === 'upload' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-primary/20 rounded-3xl p-16 flex flex-col items-center text-center gap-4 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group"
                            >
                                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <FileText className="text-primary w-10 h-10" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold">Drop your CSV file here</p>
                                    <p className="text-sm text-muted-foreground">or click to browse your workstation</p>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".csv"
                                    className="hidden"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="glassmorphism p-6 rounded-2xl border border-border/40 space-y-3">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                        <Shield size={12} /> Format Requirements
                                    </h4>
                                    <ul className="space-y-2">
                                        {['Name & Email are mandatory', 'Teams should be comma-separated', 'Role defaults to Learner', 'Designation & Dept are optional'].map((req, i) => (
                                            <li key={i} className="text-[11px] font-bold text-muted-foreground flex items-center gap-2">
                                                <div className="w-1 h-1 rounded-full bg-primary" /> {req}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="glassmorphism p-6 rounded-2xl border border-border/40 flex flex-col justify-center gap-4">
                                    <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                                        Use our official template to ensure 100% processing accuracy and automatic team routing.
                                    </p>
                                    <button
                                        onClick={downloadTemplate}
                                        className="w-full py-3 bg-secondary hover:bg-secondary/80 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                                    >
                                        <Download size={14} /> Download Template
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'preview' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-primary">
                                    <FileText size={16} /> Import Preview ({parsedData.length} Records)
                                </h3>
                                <button onClick={() => setStep('upload')} className="text-xs font-bold text-secondary-foreground hover:underline">
                                    Back to Upload
                                </button>
                            </div>

                            <div className="overflow-hidden rounded-2xl border border-border/40">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-secondary/50 border-b border-border/40">
                                        <tr>
                                            <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-wider">Name</th>
                                            <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-wider">Email</th>
                                            <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-wider">Role</th>
                                            <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-wider">Teams</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/20">
                                        {parsedData.slice(0, 5).map((row, idx) => (
                                            <tr key={idx} className="hover:bg-primary/5">
                                                <td className="px-4 py-3 font-semibold">{row.Name}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{row.Email}</td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase">
                                                        {row.Role || 'Learner'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-[10px] font-medium">{row.Teams || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {parsedData.length > 5 && (
                                    <div className="px-4 py-3 bg-secondary/20 text-[10px] text-center font-bold text-muted-foreground italic">
                                        showing first 5 of {parsedData.length} records...
                                    </div>
                                )}
                            </div>

                            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex gap-3 italic">
                                <Loader2 className="text-blue-500 shrink-0" size={20} />
                                <p className="text-xs text-blue-400 font-medium">
                                    New teams mentioned in the "Teams" column will be automatically created during processing.
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="py-20 flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                                <Users className="absolute inset-0 m-auto text-primary animate-pulse" size={32} />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-black uppercase tracking-tight">Processing Talent Pool</h3>
                                <p className="text-sm text-muted-foreground">Provisioning secure access and indexing organizational structures...</p>
                            </div>
                        </div>
                    )}

                    {step === 'results' && results && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div className="flex flex-col items-center text-center gap-4">
                                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                    <CheckCircle2 className="text-emerald-500 w-10 h-10" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black">Provisioning Complete</h3>
                                    <p className="text-sm text-muted-foreground">Successfully onboarded {results.success.length} users into the workspace.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center text-center gap-4">
                                    <Users className="text-emerald-500" size={32} />
                                    <div>
                                        <p className="text-2xl font-black text-emerald-400">{results.success.length}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/70">Successful Enrolments</p>
                                    </div>
                                    <button
                                        onClick={downloadPasswords}
                                        className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                                    >
                                        <Download size={16} /> Download Password List
                                    </button>
                                </div>

                                <div className="p-6 rounded-3xl bg-red-500/5 border border-red-500/10 flex flex-col items-center text-center gap-4 justify-center">
                                    <AlertCircle className="text-red-400" size={32} />
                                    <div>
                                        <p className="text-2xl font-black text-red-400">{results.errors.length}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-red-500/70">Failed Imports</p>
                                    </div>
                                    {results.errors.length > 0 && (
                                        <p className="text-[10px] text-muted-foreground italic truncate max-w-[200px]">
                                            Error: {results.errors[0]?.error || 'Multiple errors detected'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex gap-4">
                                <AlertCircle className="text-orange-500 shrink-0" size={20} />
                                <p className="text-xs text-orange-400 font-bold leading-relaxed">
                                    IMPORTANT: Temporary passwords are not stored for security. Please download the list now if you need to distribute them manually.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-8 py-5 border-t border-border/40 bg-secondary/10 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl font-bold text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {step === 'results' ? 'Close Panel' : 'Cancel'}
                    </button>
                    {step === 'preview' && (
                        <button
                            onClick={handleUpload}
                            disabled={isProcessing}
                            className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                        >
                            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                            Synchronize Talent
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
