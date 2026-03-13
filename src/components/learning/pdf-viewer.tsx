'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Download,
    Eye,
    AlertTriangle,
    Lock,
    Loader2,
    Minus,
    Plus,
    LayoutGrid,
    X,
    ArrowDownCircle,
    Zap,
    ZapOff,
    Info,
    PanelLeftClose,
    PanelLeft
} from 'lucide-react';

// Production Aggressive Caching Strategy
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PDF_JS_VERSION = pdfjs.version;

interface PDFViewerProps {
    url: string;
    onComplete: () => void;
    lessonComplete: boolean;
    isFocusMode?: boolean;
    className?: string;
}

/**
 * Premium PDF Viewer - Light Edition
 * - Edge-to-Edge Integrated Layout
 * - Sticky High-Res Navigator
 * - Mobile Optimized Performance
 */
export function PDFViewer({ url, onComplete, lessonComplete, isFocusMode, className }: PDFViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [maxPageReached, setMaxPageReached] = useState<number>(1);
    const [containerWidth, setContainerWidth] = useState<number>(0);
    const [scale, setScale] = useState<number>(1.0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showSidebar, setShowSidebar] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    
    // Low-Bandwidth Mode State
    const [lowBandwidth, setLowBandwidth] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const completionRef = useRef<HTMLDivElement>(null);
    const touchStart = useRef<number | null>(null);

    // Dynamic Responsive Scaling & Handlers
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            const mobile = width < 768;
            const tablet = width >= 768 && width < 1280;
            
            setIsMobile(mobile);
            setIsTablet(tablet);
            
            if (mobile || tablet) {
                setShowSidebar(false);
            } else {
                setShowSidebar(true);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        // Connection Check
        if (typeof navigator !== 'undefined' && (navigator as any).connection) {
            const conn = (navigator as any).connection;
            if (conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === '3g') {
                setLowBandwidth(true);
            }
        }

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Dedicated Container Width Observer
    useEffect(() => {
        if (!containerRef.current) return;

        const updateWidth = () => {
            if (containerRef.current) {
                const w = containerRef.current.offsetWidth;
                if (w > 0) {
                    // Subtract padding and borders
                    setContainerWidth(w > 40 ? w - 40 : w);
                }
            }
        };

        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const width = entry.contentRect.width;
                if (width > 0) {
                    setContainerWidth(width > 40 ? width - 40 : width);
                }
            }
        });

        resizeObserver.observe(containerRef.current);
        
        // Immediate check
        updateWidth();
        
        // Fallback for animation settling
        const timer = setTimeout(updateWidth, 500);

        return () => {
            resizeObserver.disconnect();
            clearTimeout(timer);
        };
    }, [showSidebar]); // Re-run when sidebar visibility changes to ensure observer is correct 


    const absoluteUrl = useMemo(() => {
        if (!url) return '';
        if (/^https?:\/\//i.test(url)) return url;
        if (typeof window !== 'undefined') {
            return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
        }
        return url;
    }, [url]);

    const documentOptions = useMemo(() => ({
        cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDF_JS_VERSION}/cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDF_JS_VERSION}/standard_fonts/`,
        disableFontFace: false,
        verbosity: 0
    }), []);

    useEffect(() => {
        if (pageNumber > maxPageReached) {
            setMaxPageReached(pageNumber);
        }
    }, [pageNumber, maxPageReached]);

    const changePage = (p: number) => {
        if (p < 1 || p > numPages || (isFocusMode && p > maxPageReached + 1)) return;
        setPageNumber(p);
        if (isMobile || isTablet) setShowSidebar(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const zoom = (delta: number) => {
        setScale(prev => Math.min(Math.max(0.4, prev + delta), 2.5));
    };

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setLoading(false);
    };

    return (
        <div className={cn("w-full relative flex flex-col bg-slate-50 min-h-screen font-outfit", className)}>
            
            {/* Edge-to-Edge Premium Toolbar */}
            <div className="sticky top-0 z-[60] px-3 md:px-8 py-3 md:py-5 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-8">
                        <button 
                            onClick={() => setShowSidebar(!showSidebar)}
                            className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-200 shrink-0"
                        >
                            {showSidebar ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
                        </button>

                        <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                <FileText size={18} className="md:size-6" />
                            </div>
                        </div>

                        <div className="hidden lg:flex items-center bg-slate-100/50 border border-slate-200 rounded-xl p-1 gap-1">
                            <button onClick={() => zoom(-0.1)} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg text-slate-400 hover:text-slate-900 transition-all"><Minus size={14} /></button>
                            <span className="text-[9px] font-black text-slate-900 px-3 min-w-[50px] text-center tabular-nums">{Math.round(scale * 100)}%</span>
                            <button onClick={() => zoom(0.1)} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg text-slate-400 hover:text-slate-900 transition-all"><Plus size={14} /></button>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 md:gap-3">
                        <div className="px-3 md:px-5 py-1.5 md:py-2 bg-slate-100 border border-slate-200 rounded-lg md:rounded-xl text-slate-900">
                             <span className="text-[9px] md:text-[11px] font-black whitespace-nowrap tabular-nums font-outfit">
                                {pageNumber} <span className="text-slate-400 mx-1">/</span> {numPages || '--'}
                             </span>
                        </div>
                        
                        <a 
                            href={absoluteUrl} 
                            download 
                            className="hidden xs:flex px-4 md:px-6 h-9 md:h-12 items-center gap-2 bg-slate-900 text-white rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200"
                        >
                            <Download size={16} /> <span className="hidden md:inline">Export PDF</span>
                        </a>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row relative w-full overflow-hidden">
                {absoluteUrl && !error ? (
                    <Document
                        file={absoluteUrl}
                        options={documentOptions}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={<PDFLoader />}
                        className="flex-1 flex flex-col lg:flex-row w-full"
                    >
                        {/* Fixed Sticky Sidebar - High Performance Navigation */}
                        <AnimatePresence>
                            {showSidebar && (
                                <motion.aside 
                                    initial={{ x: '-100%' }}
                                    animate={{ x: 0 }}
                                    exit={{ x: '-100%' }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                    className={cn(
                                        "z-[70] bg-white border-r border-slate-200 overflow-y-auto custom-scrollbar shadow-2xl lg:shadow-none",
                                        (isMobile || isTablet) ? "fixed inset-0 top-0 bottom-0 w-[280px]" : "sticky top-[86px] h-[calc(100vh-86px)] w-[240px] shrink-0"
                                    )}
                                >
                                    <div className="p-4 md:p-6 space-y-5">
                                        <div className="flex items-center justify-between mb-4 sticky top-0 bg-white py-2 z-10 border-b border-slate-100">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 font-outfit">Page Index</h3>
                                            { (isMobile || isTablet) && <button onClick={() => setShowSidebar(false)}><X size={20} className="text-slate-400" /></button> }
                                        </div>

                                        {!loading && Array.from(new Array(numPages), (el, index) => {
                                            const pNum = index + 1;
                                            const isLocked = isFocusMode && pNum > maxPageReached + 1;
                                            const isActive = pageNumber === pNum;
                                            return (
                                                <div 
                                                    key={`idx_${pNum}`}
                                                    onClick={() => !isLocked && changePage(pNum)}
                                                    className={cn(
                                                        "relative cursor-pointer rounded-2xl border-2 p-1.5 transition-all hover:border-indigo-200 hover:shadow-sm",
                                                        isActive ? "border-indigo-600 bg-indigo-50/20" : isLocked ? "opacity-30 border-slate-50 grayscale" : "border-slate-50"
                                                    )}
                                                >
                                                    <div className="aspect-[1/1.4] bg-slate-100 rounded-xl overflow-hidden relative shadow-sm border border-slate-100">
                                                        <Page 
                                                            pageNumber={pNum} 
                                                            width={150} 
                                                            renderAnnotationLayer={false} 
                                                            renderTextLayer={false}
                                                            loading={<div className="h-full w-full bg-slate-50 animate-pulse" />}
                                                        />
                                                        {isLocked && <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center"><Lock size={16} className="text-slate-400" /></div>}
                                                    </div>
                                                    <div className={cn(
                                                        "mt-2 text-center text-[8px] font-black uppercase tracking-widest font-outfit",
                                                        isActive ? "text-indigo-600" : "text-slate-400"
                                                    )}>Page {pNum}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.aside>
                            )}
                        </AnimatePresence>

                        {/* Mobile Backdrop Overlay */}
                        <AnimatePresence>
                            {showSidebar && (isMobile || isTablet) && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setShowSidebar(false)}
                                    className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-[65]"
                                />
                            )}
                        </AnimatePresence>

                        {/* Main Viewport - Integrated Layout */}
                        <main className="flex-1 flex flex-col p-2 md:p-6 lg:p-8 relative min-h-[85vh] overflow-x-hidden">
                            <div 
                                ref={containerRef}
                                className="w-full flex flex-col items-center"
                            >
                                <div className="w-full min-h-[70vh] flex flex-col bg-white rounded-2xl md:rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden p-2 md:p-4">
                                    {containerWidth > 0 && (
                                        <Page 
                                            key={`p-${pageNumber}-${containerWidth}`}
                                            pageNumber={pageNumber} 
                                            width={containerWidth * scale}
                                            renderAnnotationLayer={false}
                                            renderTextLayer={false}
                                            loading={<div className="h-[70vh] flex items-center justify-center w-full bg-slate-50 animate-pulse"><Loader2 className="animate-spin text-indigo-600/20" size={48} /></div>}
                                        />
                                    )}
                                </div>

                                <div className="flex mt-8 md:mt-12 items-center gap-6 md:gap-10 bg-white border border-slate-200 px-4 md:px-6 py-3 md:py-4 rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl sticky bottom-6 md:bottom-10 z-50">
                                    <button 
                                        onClick={() => changePage(pageNumber - 1)} 
                                        disabled={pageNumber <= 1} 
                                        className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center bg-slate-50 hover:bg-slate-900 text-slate-400 hover:text-white disabled:opacity-10 transition-all border border-slate-200 active:scale-95 shrink-0"
                                    >
                                        <ChevronLeft size={24} className="md:size-28" />
                                    </button>
                                    
                                    <div className="flex flex-col items-center shrink-0">
                                        <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest font-outfit mb-1">Navigation</span>
                                        <span className="text-sm md:text-lg font-black text-slate-900 tabular-nums font-outfit">{pageNumber} <span className="text-slate-300 text-xs md:text-sm mx-1">/</span> {numPages}</span>
                                    </div>

                                    <button 
                                        onClick={() => changePage(pageNumber + 1)} 
                                        disabled={pageNumber >= numPages || (isFocusMode && pageNumber > maxPageReached)} 
                                        className={cn(
                                            "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all border active:scale-95 shrink-0", 
                                            (pageNumber >= numPages || (isFocusMode && pageNumber > maxPageReached))
                                                ? "bg-slate-50 border-slate-200 text-slate-200" 
                                                : "bg-indigo-600 border-indigo-500 text-white hover:bg-slate-900 shadow-xl shadow-indigo-100"
                                        )}
                                    >
                                        <ChevronRight size={24} className="md:size-28" />
                                    </button>
                                </div>

                                <div ref={completionRef} className="w-full mt-10 md:mt-20 mb-20">
                                    { (lessonComplete || (pageNumber === numPages)) && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 40 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={cn(
                                                "p-8 md:p-14 rounded-[2.5rem] md:rounded-[4rem] flex flex-col lg:flex-row items-center justify-between gap-10 overflow-hidden relative",
                                                lessonComplete ? "bg-emerald-500 text-white shadow-3xl shadow-emerald-100" : "bg-white border border-slate-200 shadow-2xl"
                                            )}
                                        >
                                            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 relative z-10 text-center md:text-left">
                                                <div className={cn(
                                                    "w-16 h-16 md:w-24 md:h-24 rounded-[1.75rem] md:rounded-[3rem] flex items-center justify-center border-4 transition-all duration-1000", 
                                                    lessonComplete ? "bg-white text-emerald-600 border-white/20" : "bg-indigo-50 text-indigo-600 border-indigo-100"
                                                )}>
                                                    {lessonComplete ? <CheckCircle2 className="w-8 h-8 md:w-12 md:h-12" /> : <Eye className="w-8 h-8 md:w-12 md:h-12" />}
                                                </div>
                                                <div>
                                                    <h4 className="text-2xl md:text-4xl font-black uppercase tracking-tight leading-none mb-3 font-outfit">
                                                        {lessonComplete ? 'Mastery Recorded' : 'Analyze Complete'}
                                                    </h4>
                                                    <p className={cn(
                                                        "text-[9px] md:text-xs font-bold uppercase tracking-[0.2em] font-outfit",
                                                        lessonComplete ? "text-white/60" : "text-slate-400"
                                                    )}>
                                                        {lessonComplete ? 'Your account has been synced with this curriculum.' : 'Finalize your session to update academic records.'}
                                                    </p>
                                                </div>
                                            </div>

                                            {!lessonComplete && (
                                                <button
                                                    onClick={onComplete}
                                                    className="w-full lg:w-auto bg-slate-900 text-white px-10 md:px-20 h-16 md:h-24 rounded-xl md:rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] md:text-[11px] hover:bg-indigo-600 transition-all shadow-3xl active:scale-95 flex items-center justify-center gap-4 relative z-10 group font-outfit"
                                                >
                                                    Complete Lesson <ArrowDownCircle size={20} />
                                                </button>
                                            )}
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </main>
                    </Document>
                ) : (
                    <div className="w-full h-full flex items-center justify-center p-8 md:p-20">
                        <div className="py-24 md:py-40 px-6 text-center bg-white border border-slate-200 rounded-[2.5rem] md:rounded-[4rem] shadow-2xl w-full max-w-2xl">
                            <AlertTriangle className="mx-auto text-rose-500 mb-6" size={56} />
                            <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight font-outfit">Resource Unavailable</h3>
                            <p className="text-[10px] md:text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-4 leading-relaxed max-w-xs mx-auto">Could not establish a secure document stream. Please check your data connection.</p>
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .react-pdf__Page__canvas { margin: 0 auto !important; display: block !important; max-width: 100% !important; }
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
                .font-outfit { font-family: 'Outfit', sans-serif; }
            `}</style>
        </div>
    );
}

function PDFLoader() {
    return (
        <div className="flex flex-col items-center gap-10 py-64">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
                <div className="absolute inset-0 w-16 h-16 border-4 border-indigo-600/10 rounded-full blur-[2px]" />
            </div>
            <div className="text-center space-y-3 font-outfit">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.6em] animate-pulse">Initializing Streams</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Optimizing buffers</p>
            </div>
        </div>
    );
}
