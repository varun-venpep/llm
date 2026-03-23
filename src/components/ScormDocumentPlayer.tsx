'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Loader2, FileText } from 'lucide-react';

// Configure the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface ScormDocumentPlayerProps {
    url: string;
    domain: string;
    lessonId: string;
    userId: string;
    initialPosition?: number;
    onComplete: () => void;
}

export default function ScormDocumentPlayer({ url, domain, lessonId, userId, initialPosition = 1, onComplete }: ScormDocumentPlayerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(initialPosition > 0 ? initialPosition : 1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [loading, setLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<unknown>(null);

    // Save position to database via API
    const savePosition = async (page: number) => {
        try {
            await fetch(`/api/t/${domain}/progress/position`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, lessonId, position: page })
            });
        } catch (e) {
            console.error("Failed to save doc position", e);
        }
    };

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setLoading(false);
        // Ensure initial position is within bounds
        const startPage = Math.min(Math.max(1, initialPosition), numPages);
        setPageNumber(startPage);
        savePosition(startPage);
        
        // If the document is only 1 page long, mark it complete immediately
        if (numPages === 1) {
            onComplete();
        }
    }

    function onDocumentLoadError(error: Error) {
        console.error("Failed to load PDF:", error);
        setError(error);
        setLoading(false);
    }

    const changePage = (offset: number) => {
        setPageNumber(prevPageNumber => {
            const newPage = prevPageNumber + offset;
            const validPage = Math.min(Math.max(1, newPage), numPages);
            
            // Save position externally
            savePosition(validPage);
            
            // If they reached the last page, mark lesson complete
            if (validPage === numPages) {
                onComplete();
            }
            
            return validPage;
        });
    };

    const previousPage = () => changePage(-1);
    const nextPage = () => changePage(1);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Also listen for arrow keys to change pages
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') previousPage();
            if (e.key === 'ArrowRight') nextPage();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [numPages, pageNumber]);

    return (
        <div ref={containerRef} className={`flex flex-col items-center bg-secondary/10 border border-white/10 rounded-2xl overflow-hidden ${isFullscreen ? 'h-screen w-screen bg-black' : 'w-full min-h-[60vh]'}`}>
            {/* Toolbar */}
            <div className={`w-full flex items-center justify-between p-4 ${isFullscreen ? 'bg-black/50 backdrop-blur-md absolute top-0 z-50' : 'bg-background border-b border-white/5'}`}>
                <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="font-bold text-sm">Presentation Viewer</span>
                </div>
                
                {numPages > 0 && (
                    <div className="flex items-center gap-4 bg-secondary/50 rounded-full px-2 py-1">
                        <button 
                            disabled={pageNumber <= 1} 
                            onClick={previousPage}
                            className="p-1 rounded-full hover:bg-background disabled:opacity-30 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground w-20 text-center">
                            {pageNumber} / {numPages}
                        </span>
                        <button 
                            disabled={pageNumber >= numPages} 
                            onClick={nextPage}
                            className="p-1 rounded-full hover:bg-background disabled:opacity-30 transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
                
                <button onClick={toggleFullscreen} className="p-2 hover:bg-secondary/50 rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
            </div>

            {/* Document Container */}
            <div className={`flex-1 w-full flex items-center justify-center overflow-auto custom-scrollbar ${isFullscreen ? 'pt-16 pb-6' : 'p-6'}`}>
                {error ? (
                    <div className="text-center space-y-4">
                        <FileText className="w-16 h-16 mx-auto text-red-500/50" />
                        <p className="text-red-400 font-bold">Failed to load presentation.</p>
                        <p className="text-xs text-muted-foreground max-w-sm">Please ensure the material was uploaded as a PDF file to enable native tracking.</p>
                    </div>
                ) : (
                    <div className="shadow-2xl shadow-black/50 bg-white inline-block">
                        <Document
                            file={url}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={onDocumentLoadError}
                            loading={
                                <div className="flex flex-col items-center justify-center h-[50vh] w-[60vw]">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                                    <span className="text-sm font-bold animate-pulse text-muted-foreground">Loading presentation...</span>
                                </div>
                            }
                        >
                            {numPages > 0 && (
                                <Page 
                                    pageNumber={pageNumber} 
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                    className="max-w-full"
                                    width={isFullscreen ? (typeof window !== 'undefined' ? window.innerWidth * 0.8 : 1000) : undefined}
                                />
                            )}
                        </Document>
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            {numPages > 0 && (
                <div className={`w-full h-1.5 bg-secondary/30 ${isFullscreen ? 'absolute bottom-0' : ''}`}>
                    <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${(pageNumber / numPages) * 100}%` }}
                    />
                </div>
            )}
        </div>
    );
}
