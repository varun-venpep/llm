'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Download, FileText, ImageIcon, ChevronLeft, Loader2, Printer, ShieldCheck, Share2 } from 'lucide-react';
import { toJpeg, toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

export default function CertificateViewPage() {
    const params = useParams();
    const router = useRouter();
    const domain = params.domain as string;
    const courseId = params.courseId as string;
    
    const [certificateHtml, setCertificateHtml] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState<'pdf' | 'jpeg' | null>(null);
    const certRef = useRef<HTMLDivElement>(null);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const uid = localStorage.getItem(`${domain}_userId`);
        setUserId(uid);
        if (uid) {
            fetchCertificate(uid);
        } else {
            router.push(`/t/${domain}/login`);
        }
    }, [domain, courseId]);

    const fetchCertificate = async (uid: string) => {
        try {
            const res = await fetch(`/api/t/${domain}/certificates/view?userId=${uid}&courseId=${courseId}`);
            if (res.ok) {
                const html = await res.text();
                // Extract only the inner content of the certificate-container from the raw HTML API
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const container = doc.querySelector('.certificate-container');
                if (container) {
                    setCertificateHtml(container.innerHTML);
                    // Also need the background image from the inline style
                    const bgUrl = (container as HTMLElement).style.backgroundImage.slice(5, -2);
                    setBgImage(bgUrl);
                }
            } else {
                console.error('Certificate not found');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const [bgImage, setBgImage] = useState('');

    const downloadPDF = async () => {
        if (!certRef.current) return;
        setDownloading('pdf');
        try {
            const dataUrl = await toPng(certRef.current, { quality: 1.0, pixelRatio: 2 });
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [certRef.current.offsetWidth * 2, certRef.current.offsetHeight * 2]
            });
            pdf.addImage(dataUrl, 'PNG', 0, 0, certRef.current.offsetWidth * 2, certRef.current.offsetHeight * 2);
            pdf.save(`Certificate-${courseId}.pdf`);
        } catch (e) {
            console.error(e);
        } finally {
            setDownloading(null);
        }
    };

    const downloadJPEG = async () => {
        if (!certRef.current) return;
        setDownloading('jpeg');
        try {
            const dataUrl = await toJpeg(certRef.current, { quality: 1.0, pixelRatio: 2 });
            const link = document.createElement('a');
            link.download = `Certificate-${courseId}.jpeg`;
            link.href = dataUrl;
            link.click();
        } catch (e) {
            console.error(e);
        } finally {
            setDownloading(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary/50" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Forging Achievement Record...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans">
            {/* Header / Controls */}
            <header className="fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
                <button 
                    onClick={() => router.back()}
                    className="flex items-center gap-3 px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all group"
                >
                    <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-widest">Exit Preview</span>
                </button>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={downloadJPEG}
                        disabled={!!downloading}
                        className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                        {downloading === 'jpeg' ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                        JPEG
                    </button>
                    <button 
                        onClick={downloadPDF}
                        disabled={!!downloading}
                        className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-primary/20 hover:scale-105 disabled:opacity-50"
                    >
                        {downloading === 'pdf' ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                        Download PDF
                    </button>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center p-12 pt-32">
                <div className="max-w-6xl w-full flex flex-col lg:flex-row gap-12 items-center">
                    {/* Certificate Preview Card */}
                    <div className="flex-1 w-full space-y-6">
                        <div 
                            ref={certRef}
                            className="relative aspect-[1.414/1] w-full bg-white rounded-sm shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-hidden select-none"
                            style={{ 
                                backgroundImage: `url('${bgImage}')`, 
                                backgroundSize: 'cover', 
                                backgroundPosition: 'center' 
                            }}
                            dangerouslySetInnerHTML={{ __html: certificateHtml || '' }}
                        />
                        <div className="flex items-center justify-center gap-8 py-4 opacity-40">
                             <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]"><ShieldCheck size={14} className="text-primary" /> Verified Achievement</div>
                             <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]"><Printer size={14} className="text-primary" /> Print Optimized</div>
                             <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]"><Share2 size={14} className="text-primary" /> Permanent Record</div>
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="w-full lg:w-96 space-y-8 animate-in slide-in-from-right-8 duration-700">
                        <div className="space-y-2">
                             <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-[0.2em] rounded-full">Official Credential</span>
                             <h1 className="text-3xl font-black tracking-tight leading-none pt-1">Academic Distinction</h1>
                             <p className="text-sm text-neutral-400 font-medium leading-relaxed">
                                This certificate represents a comprehensive mastery of the course curriculum and serves as an official testament to your professional development independently verified by the platform.
                             </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                 <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Standard</p>
                                 <p className="text-sm font-bold uppercase tracking-tight">ISO-27001 Ready</p>
                             </div>
                             <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                 <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Security</p>
                                 <p className="text-sm font-bold uppercase tracking-tight">Sha-256 Encrypted</p>
                             </div>
                        </div>

                        <div className="space-y-4">
                             <button onClick={() => window.print()} className="w-full py-4 border border-white/20 hover:bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2">
                                <Printer size={14} /> Send to Printer
                             </button>
                             <p className="text-center text-[9px] font-bold text-neutral-600 uppercase tracking-widest leading-relaxed">
                                Certificate ID: {courseId.substring(0, 8).toUpperCase()}<br/>
                                Handcrafted by the {domain.toUpperCase()} Creative Engine
                             </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
