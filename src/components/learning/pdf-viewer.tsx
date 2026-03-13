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
    Wifi,
    WifiOff,
    Zap,
    ZapOff,
    Info
} from 'lucide-react';

// Production Aggressive Caching Strategy
// Use the version exactly matching the installed pdfjs-dist to prevent version mismatch errors
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Define version for CDNs to follow if needed
const PDF_JS_VERSION = pdfjs.version;

interface PDFViewerProps {
    url: string;
    onComplete: () => void;
    lessonComplete: boolean;
    isFocusMode?: boolean;
    className?: string;
}

export function PDFViewer({ url, onComplete, lessonComplete, isFocusMode, className }: PDFViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [maxPageReached, setMaxPageReached] = useState<number>(1);
    const [containerWidth, setContainerWidth] = useState<number>(0);
    const [scale, setScale] = useState<number>(1.0);
    const [rotate, setRotate] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showMobileNav, setShowMobileNav] = useState(false);
    
    // Low-Bandwidth Mode State
    const [lowBandwidth, setLowBandwidth] = useState(false);
    const [showDataSavedTip, setShowDataSavedTip] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const completionRef = useRef<HTMLDivElement>(null);
    const touchStart = useRef<number | null>(null);

    // Auto-detect slow connections (Network Information API)
    useEffect(() => {
        if (typeof navigator !== 'undefined' && (navigator as any).connection) {
            const conn = (navigator as any).connection;
            if (conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === '3g') {
                setLowBandwidth(true);
                setShowDataSavedTip(true);
            }
        }
    }, []);

    const absoluteUrl = useMemo(() => {
        if (!url) return '';
        if (/^https?:\/\//i.test(url)) return url;
        if (typeof window !== 'undefined') {
            const origin = window.location.origin;
            return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
        }
        return url;
    }, [url]);

    const documentOptions = useMemo(() => ({
        cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDF_JS_VERSION}/cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDF_JS_VERSION}/standard_fonts/`,
        // Optimization: Disable font hinting and use smoother rendering for low bandwidth
        disableFontFace: false,
        verbosity: 0
    }), []);

    useEffect(() => {
        if (pageNumber > maxPageReached) {
            setMaxPageReached(pageNumber);
            if (pageNumber === numPages) {
                setTimeout(() => {
                    completionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 500);
            }
        }
    }, [pageNumber, maxPageReached, numPages]);

    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                const w = containerRef.current.offsetWidth;
                setContainerWidth(w > 20 ? w - 16 : w);
            }
        };

        const observer = new ResizeObserver(updateWidth);
        if (containerRef.current) observer.observe(containerRef.current);
        updateWidth();
        return () => observer.disconnect();
    }, []);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStart.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart.current) return;
        const touchEnd = e.changedTouches[0].clientX;
        const distance = touchStart.current - touchEnd;
        
        if (Math.abs(distance) > 70) {
            if (distance > 0) {
                if (pageNumber < numPages && pageNumber <= maxPageReached) changePage(pageNumber + 1);
            } else {
                if (pageNumber > 1) changePage(pageNumber - 1);
            }
        }
        touchStart.current = null;
    };

    const changePage = (p: number) => {
        if (p < 1 || p > numPages || p > maxPageReached + 1) return;
        setPageNumber(p);
        setShowMobileNav(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const zoom = (delta: number) => {
        setScale(prev => Math.min(Math.max(0.4, prev + delta), 2.5));
    };

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setLoading(false);
        setError(null);
    };

    const onDocumentLoadError = (err: Error) => {
        console.error('PDF Library Error:', err);
        setError('Document could not be loaded.');
        setLoading(false);
    };

    const isLastPageReached = maxPageReached === numPages;
    const canShowCompletion = isLastPageReached || lessonComplete;

    return (
        <div className={cn("w-full relative flex flex-col", className)}>
            
            {/* Low Bandwidth Notice */}
            <AnimatePresence>
                {showDataSavedTip && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-between px-4 py-2 overflow-hidden"
                    >
                        <div className="flex items-center gap-2">
                             <Zap size={12} className="text-amber-300" />
                             <span>Data Saver Active: Optimized for Mobile Network</span>
                        </div>
                        <button onClick={() => setShowDataSavedTip(false)}><X size={12} /></button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toolbar */}
            <div className="sticky top-0 z-[60] flex items-center justify-between py-2.5 px-3 md:py-4 md:px-6 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm sm:rounded-2xl sm:mb-4">
                <div className="flex items-center gap-2 md:gap-6">
                    <button 
                        onClick={() => setShowMobileNav(!showMobileNav)}
                        className="lg:hidden p-2.5 bg-slate-50 text-slate-600 rounded-xl active:scale-90 transition-all"
                    >
                        {showMobileNav ? <X size={18} /> : <LayoutGrid size={18} />}
                    </button>

                    <div className="hidden lg:flex items-center gap-2 text-slate-400">
                        <FileText size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">Document</span>
                    </div>
                    
                    <div className="flex items-center bg-slate-100 rounded-xl p-0.5">
                        <button onClick={() => zoom(-0.1)} className="p-2 hover:bg-white rounded-lg text-slate-600 active:scale-90 transition-all"><Minus size={14} /></button>
                        <span className="text-[11px] md:text-sm font-bold text-slate-800 px-2 min-w-[45px] text-center tabular-nums">{Math.round(scale * 100)}%</span>
                        <button onClick={() => zoom(0.1)} className="p-2 hover:bg-white rounded-lg text-slate-600 active:scale-90 transition-all"><Plus size={14} /></button>
                    </div>

                    {/* Bandwidth Toggle */}
                    <button 
                         onClick={() => setLowBandwidth(!lowBandwidth)}
                         className={cn(
                             "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                             lowBandwidth ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-slate-50 text-slate-400 border border-slate-100"
                         )}
                    >
                        {lowBandwidth ? <Zap size={14} /> : <ZapOff size={14} />}
                        <span>{lowBandwidth ? 'High Performance' : 'Standard'}</span>
                    </button>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <div className="px-2.5 py-1.5 md:px-4 md:py-2 bg-slate-50 border border-slate-100 rounded-xl">
                         <span className="text-[10px] md:text-xs font-black text-slate-600 whitespace-nowrap tabular-nums">
                            {pageNumber} <span className="text-slate-300 mx-0.5">/</span> {numPages || '--'}
                         </span>
                    </div>
                    {absoluteUrl && (
                        <a href={absoluteUrl} download className="p-2.5 bg-slate-950 text-white rounded-xl active:scale-90 transition-all shadow-md">
                            <Download size={18} />
                        </a>
                    )}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row relative items-start w-full">
                {/* Mobile Chapters Drawer */}
                <AnimatePresence>
                    {showMobileNav && (
                        <motion.aside 
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-0 z-[100] bg-white lg:hidden overflow-y-auto"
                        >
                            <div className="sticky top-0 bg-white/80 backdrop-blur-md p-5 border-b flex items-center justify-between z-10">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Document Chapters</h3>
                                <button onClick={() => setShowMobileNav(false)} className="p-2 bg-slate-100 rounded-full"><X size={20} /></button>
                            </div>
                            <div className="p-4 grid grid-cols-2 gap-4 pb-20 text-center">
                                {/* Thumbnails disabled in manual low bandwidth to save data */}
                                {lowBandwidth && (
                                    <div className="col-span-2 py-10 px-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <Info size={24} className="mx-auto text-slate-400 mb-2" />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thumbnails hidden to save data</p>
                                    </div>
                                )}
                                {!lowBandwidth && Array.from(new Array(numPages), (el, index) => {
                                    const pNum = index + 1;
                                    const isLocked = pNum > maxPageReached + 1;
                                    const isActive = pageNumber === pNum;
                                    return (
                                        <div 
                                            key={`mob_${pNum}`}
                                            onClick={() => !isLocked && changePage(pNum)}
                                            className={cn(
                                                "relative rounded-xl overflow-hidden border-2 p-1 transition-all",
                                                isActive ? "border-indigo-600 bg-indigo-50" : isLocked ? "opacity-30 border-slate-100" : "border-slate-100"
                                            )}
                                        >
                                            <div className="aspect-[1/1.4] bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center">
                                                <Page pageNumber={pNum} width={150} renderAnnotationLayer={false} renderTextLayer={false} />
                                                {isLocked && <Lock className="absolute text-slate-400" size={16} />}
                                            </div>
                                            <div className="mt-2 text-center text-[10px] font-bold text-slate-500">Page {pNum}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* Desktop Side Navigation */}
                <aside className="hidden lg:block w-[220px] flex-shrink-0 sticky top-32 max-h-[80vh] overflow-y-auto custom-scrollbar-clean pr-4">
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <LayoutGrid size={14} className="text-slate-400" />
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Chapters</h3>
                    </div>
                    {absoluteUrl && !error && (
                        <Document
                            file={absoluteUrl}
                            options={documentOptions}
                            onLoadSuccess={onDocumentLoadSuccess}
                            className="space-y-3"
                        >
                            {Array.from(new Array(numPages), (el, index) => {
                                const pNum = index + 1;
                                const isLocked = pNum > maxPageReached + 1;
                                const isActive = pageNumber === pNum;
                                return (
                                    <div 
                                        key={`dt_${pNum}`}
                                        onClick={() => !isLocked && changePage(pNum)}
                                        className={cn(
                                            "relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all p-1",
                                            isActive ? "border-indigo-600 shadow-sm" : isLocked ? "opacity-30 border-transparent" : "border-transparent hover:border-slate-200"
                                        )}
                                    >
                                        <div className="aspect-[1/1.4] bg-slate-50 rounded-lg overflow-hidden relative">
                                            {/* Data Saving: Don't render complex thumbnails */}
                                            {lowBandwidth ? (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                                    <span className="text-[10px] font-black text-slate-300">P{pNum}</span>
                                                </div>
                                            ) : (
                                                <Page pageNumber={pNum} width={200} renderAnnotationLayer={false} renderTextLayer={false} />
                                            )}
                                            {isLocked && <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center"><Lock size={12} className="text-slate-400" /></div>}
                                        </div>
                                        <div className="mt-1.5 text-center text-[9px] font-bold text-slate-400">PAGE {pNum}</div>
                                    </div>
                                );
                            })}
                        </Document>
                    )}
                </aside>

                {/* Main Viewport */}
                <div 
                    id="pdf-focus-zone" 
                    ref={containerRef}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    className="flex-1 w-full flex flex-col items-center min-h-[70vh] relative mt-2 sm:mt-0"
                >
                    {absoluteUrl && !error ? (
                        <Document
                            file={absoluteUrl}
                            options={documentOptions}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={onDocumentLoadError}
                            loading={<DocumentLoader />}
                            className="w-full flex flex-col items-center"
                        >
                            <div className="bg-white shadow-xl ring-1 ring-slate-200/50 rounded-sm overflow-hidden touch-pan-y">
                                {containerWidth > 0 && (
                                    <Page 
                                        key={`p-${pageNumber}-${containerWidth}-${lowBandwidth ? 'low' : 'high'}`}
                                        pageNumber={pageNumber} 
                                        width={containerWidth * scale}
                                        rotate={rotate}
                                        renderAnnotationLayer={!lowBandwidth} // Optimization: skip annotation layer in low bandwidth
                                        renderTextLayer={true}
                                        // Resolution control: set devicePixelRatio to 1 in low bandwidth to save CPU/Memory
                                        devicePixelRatio={lowBandwidth ? 1 : Math.min(window.devicePixelRatio || 1, 2)}
                                        loading={<div className="h-[60vh] flex items-center justify-center w-full bg-slate-50 animate-pulse"><Loader2 className="animate-spin text-slate-200" size={32} /></div>}
                                    />
                                )}
                            </div>

                            <div className="lg:hidden mt-4 flex items-center justify-center gap-2 opacity-30">
                                <ChevronLeft size={12} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Swipe for pages</span>
                                <ChevronRight size={12} />
                            </div>

                            <div className="hidden lg:flex mt-8 items-center gap-6 bg-white/90 backdrop-blur-md border border-slate-200 p-2 rounded-full shadow-lg sticky bottom-8 z-50">
                                <button onClick={() => changePage(pageNumber - 1)} disabled={pageNumber <= 1} className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-50 hover:bg-slate-100 disabled:opacity-20 transition-all"><ChevronLeft size={24} /></button>
                                <span className="text-sm font-black tabular-nums">{pageNumber} .. {numPages}</span>
                                <button onClick={() => changePage(pageNumber + 1)} disabled={pageNumber >= numPages || pageNumber > maxPageReached} className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-all", (pageNumber >= numPages || pageNumber > maxPageReached) ? "bg-slate-50 text-slate-200" : "bg-slate-950 text-white hover:bg-indigo-600")}><ChevronRight size={24} /></button>
                            </div>
                        </Document>
                    ) : (
                        <div className="py-40 px-6 text-center">
                            <AlertTriangle className="mx-auto text-red-500 mb-4" size={40} />
                            <h3 className="text-lg font-bold">Failed to Load</h3>
                            <p className="text-xs text-slate-500 mt-2">Could not establish document stream.</p>
                        </div>
                    )}

                    <div ref={completionRef} className="w-full mt-12 mb-20 px-4">
                        {canShowCompletion && (
                            <motion.div 
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    "p-8 lg:p-14 rounded-[2.5rem] border flex flex-col lg:flex-row items-center justify-between gap-10",
                                    lessonComplete ? "bg-emerald-50 border-emerald-100" : "bg-white border-slate-200 shadow-2xl ring-1 ring-slate-100"
                                )}
                            >
                                <div className="flex items-center gap-6 lg:gap-10">
                                    <div className={cn("w-16 h-16 lg:w-24 lg:h-24 rounded-2xl lg:rounded-[2.5rem] flex items-center justify-center border-4", lessonComplete ? "bg-emerald-500 text-white border-emerald-100" : "bg-slate-100 text-indigo-600 border-white shadow-inner")}>
                                        {lessonComplete ? <CheckCircle2 className="w-8 h-8 lg:w-12 lg:h-12" /> : <Eye className="w-8 h-8 lg:w-12 lg:h-12" />}
                                    </div>
                                    <div className="text-left">
                                        <h4 className="text-2xl lg:text-4xl font-black uppercase tracking-tight text-slate-900 leading-none">
                                            {lessonComplete ? 'Lesson Read' : 'Complete Topic'}
                                        </h4>
                                        <p className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                                            {lessonComplete ? 'Successfully recorded in your analytics.' : 'Confirm you have analyzed all pages to proceed.'}
                                        </p>
                                    </div>
                                </div>

                                {!lessonComplete && (
                                    <button
                                        onClick={onComplete}
                                        className="w-full lg:w-auto bg-slate-950 text-white px-12 lg:px-20 h-20 lg:h-24 rounded-2xl lg:rounded-[2.5rem] font-black uppercase tracking-widest text-xs hover:bg-indigo-600 transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        Mark as Completed <ArrowDownCircle className="animate-bounce" size={20} />
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar-clean::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar-clean::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .react-pdf__Page__canvas { margin: 0 auto !important; display: block !important; max-width: 100% !important; height: auto !important; }
            `}</style>
        </div>
    );
}

function DocumentLoader() {
    return (
        <div className="flex flex-col items-center gap-6 py-40">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.4em]">Initializing...</p>
        </div>
    );
}
