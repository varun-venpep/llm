'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Award, Printer } from 'lucide-react';

export default function CertificatePage() {
    const params = useParams();
    const domain = params.domain as string;
    const courseId = params.courseId as string;

    const [course, setCourse] = useState<any>(null);
    const [tenantName, setTenantName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTenantName(domain.charAt(0).toUpperCase() + domain.slice(1));
        fetchCourse();
    }, [domain, courseId]);

    const fetchCourse = async () => {
        try {
            const res = await fetch(`/api/t/${domain}/courses/${courseId}`);
            if (res.ok) {
                const data = await res.json();
                setCourse(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-gray-900 border-t-transparent animate-spin" /></div>;
    }

    if (!course) {
        return <div className="min-h-screen bg-white flex items-center justify-center text-gray-900 font-bold">Course not found.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center py-12 px-4 print:py-0 print:px-0 print:bg-white overflow-x-auto">
            
            {/* Action Bar (hidden when printing) */}
            <div className="mb-8 flex gap-4 print:hidden">
                <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg"
                >
                    <Printer size={18} /> Print as PDF
                </button>
                <button 
                    onClick={() => window.close()}
                    className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-800 font-bold rounded-xl transition-colors shadow border border-gray-200"
                >
                    Close Tab
                </button>
            </div>

            {/* Certificate Canvas (A4 Landscape aspect ratio approximate - 1123x794) */}
            <div className="w-[1123px] h-[794px] bg-white shadow-2xl print:shadow-none border-[16px] border-double border-gray-200 relative p-16 flex flex-col text-center" style={{ pageBreakAfter: 'always' }}>
                
                {/* Background Decor */}
                <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600" />
                <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600" />
                
                {/* Tenant Logo / Name */}
                <div className="flex flex-col items-center justify-center mb-12">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
                        <Award className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-black uppercase tracking-[0.3em] text-gray-800">{tenantName} ACADEMY</h1>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                    <h2 className="text-gray-500 font-semibold tracking-[0.4em] uppercase text-sm">Certificate of Completion</h2>
                    <h3 className="text-6xl font-serif text-gray-900 italic mt-8 mb-12">This is to certify that</h3>
                    
                    {/* Student Name Placeholder */}
                    <div className="w-full max-w-2xl border-b-2 border-gray-300 pb-2 mb-8">
                        <h4 className="text-5xl font-black text-gray-900">Dedicated Learner</h4>
                    </div>

                    <p className="text-xl text-gray-700">has successfully completed the course</p>
                    <h5 className="text-4xl font-bold text-blue-800 mt-4 px-12 leading-tight">{course.title}</h5>
                </div>

                {/* Footer Signatures */}
                <div className="flex justify-between items-end mt-16 px-16">
                    <div className="text-center w-64 border-t-2 border-gray-300 pt-4">
                        <p className="text-gray-800 font-bold font-serif text-2xl italic signature">Administrator</p>
                        <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mt-2">Authorized Signature</p>
                    </div>
                    
                    {/* Gold Seal */}
                    <div className="relative w-32 h-32 flex items-center justify-center transform hover:scale-105 transition-transform duration-500">
                        <div className="absolute inset-0 bg-yellow-400 rounded-full flex items-center justify-center transform rotate-45 border-4 border-yellow-200">
                            <div className="absolute inset-2 bg-yellow-500 rounded-full border border-yellow-300" />
                        </div>
                        <div className="absolute inset-0 bg-yellow-400 rounded-full flex items-center justify-center transform rotate-12 border-4 border-yellow-200">
                            <div className="absolute inset-2 bg-yellow-500 rounded-full border border-yellow-300" />
                        </div>
                        <div className="absolute inset-0 bg-yellow-400 rounded-full border-4 border-yellow-300 flex items-center justify-center z-10 shadow-inner">
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase text-yellow-900 tracking-widest leading-none">Official</p>
                                <Award className="w-8 h-8 text-yellow-100 mx-auto my-1" />
                                <p className="text-[8px] font-bold text-yellow-800 tracking-widest">CERTIFIED</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-center w-64 border-t-2 border-gray-300 pt-4">
                        <p className="text-gray-800 font-bold mb-1">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mt-2">Date of Issue</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
