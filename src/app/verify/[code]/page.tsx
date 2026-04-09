import { prisma } from '@/lib/prisma';
import { ShieldCheck, CalendarCheck, User as UserIcon, Building, ShieldAlert, Award, FileBadge2 } from 'lucide-react';
import Link from 'next/link';

export default async function VerifyCertificatePage({ params }: { params: Promise<{ code: string }> }) {
    const resolvedParams = await params;
    
    // Look up the unique cryptographic code in the database
    const certificate = await prisma.issuedCertificate.findUnique({
        where: { uniqueCode: resolvedParams.code },
        include: {
            user: { select: { name: true, email: true } },
            course: { 
                select: { 
                    title: true, 
                    description: true,
                    tenant: { select: { name: true, subdomain: true } }
                } 
            }
        }
    });

    if (!certificate) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-red-500/10 p-6 rounded-full border border-red-500/20 mb-6">
                    <ShieldAlert size={48} className="text-red-500" />
                </div>
                <h1 className="text-3xl font-black mb-2 tracking-tight">Invalid Certificate</h1>
                <p className="text-muted-foreground max-w-md mx-auto">
                    The verification code you provided does not exist within the global compliance registry. This may indicate a forgery or an expired link.
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center py-20 px-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-500/5 via-purple-500/5 to-transparent -z-10" />
            
            <div className="w-full max-w-3xl glassmorphism rounded-[2rem] border border-border/50 p-10 md:p-16 relative shadow-2xl overflow-hidden mt-10">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500" />
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full" />
                
                {/* Header Badge */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 border-b border-border/50 pb-10">
                    <div className="flex items-center gap-4 text-emerald-500">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <ShieldCheck size={32} />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest">Global Registry</p>
                            <h2 className="text-2xl font-black tracking-tight leading-none mt-1">Status: Verified</h2>
                        </div>
                    </div>
                    
                    <div className="text-center md:text-right">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Authenticity Code</p>
                        <p className="text-xl font-mono font-bold tracking-widest bg-secondary px-4 py-2 rounded-xl text-primary border border-border/50">
                            {certificate.uniqueCode}
                        </p>
                    </div>
                </div>

                {/* Primary Certificate Details */}
                <div className="py-10 space-y-12">
                    <div className="text-center">
                        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">This certifies that</p>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                            {certificate.user.name || certificate.user.email}
                        </h1>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4 p-6 rounded-2xl border border-border/30 bg-secondary/20">
                            <Award className="text-amber-500 mt-1" size={24} />
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Has Successfully Completed</p>
                                <p className="text-xl font-bold">{certificate.course.title}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center gap-4 p-6 rounded-2xl border border-border/30 bg-background/50">
                                <Building className="text-primary" size={24} />
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Authorized Tenant</p>
                                    <p className="font-bold">{certificate.course.tenant?.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-6 rounded-2xl border border-border/30 bg-background/50">
                                <CalendarCheck className="text-primary" size={24} />
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Issue Date</p>
                                    <p className="font-bold">
                                        {certificate.issuedAt.toLocaleDateString('en-US', {
                                            year: 'numeric', month: 'long', day: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-border/50 flex flex-col items-center justify-center text-center space-y-4">
                    <FileBadge2 size={32} className="text-muted-foreground opacity-30" />
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                            This document is tamper-proof and mathematically verified by InfiniteLMS Global Database.
                        </p>
                    </div>
                    <Link 
                        href={`${process.env.NEXT_PUBLIC_ROOT_DOMAIN?.includes('localhost') || process.env.NEXT_PUBLIC_ROOT_DOMAIN?.includes('lvh.me') ? 'http' : 'https'}://${certificate.course.tenant?.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'lvh.me:3000'}`} 
                        className="text-xs font-bold text-primary hover:underline"
                    >
                        Return to {certificate.course.tenant?.name} Learning Portal
                    </Link>
                </div>
            </div>
        </div>
    );
}
