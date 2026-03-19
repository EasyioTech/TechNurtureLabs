'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Eye,
    AlertTriangle,
    Loader2,
    ArrowDownCircle
} from 'lucide-react';

// Use local worker to avoid CDN dependency and CSP issues in production.
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PDFViewerProps {
    url: string;
    onComplete: () => void;
    lessonComplete: boolean;
    pageNumber: number;
    docMax: number;
    onLoadTotalPages?: (n: number) => void;
    onPageChange?: (n: number) => void;
    className?: string;
}

export function PDFViewer({
    url,
    onComplete,
    lessonComplete,
    pageNumber,
    docMax,
    onLoadTotalPages,
    onPageChange,
    className,
}: PDFViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    // Cap at 900px — prevents over-large canvas allocations on tablets/desktops.
    // Mobile screens are typically 360-430px, so this never hurts mobile.
    const MAX_RENDER_WIDTH = 900;
    const [containerWidth, setContainerWidth] = useState<number>(400);
    const [scale, setScale] = useState<number>(1.0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                const w = containerRef.current.offsetWidth;
                if (w > 0) setContainerWidth(Math.min(w, MAX_RENDER_WIDTH));
            }
        };

        const resizeObserver = new ResizeObserver(updateWidth);
        if (containerRef.current) resizeObserver.observe(containerRef.current);
        updateWidth();
        return () => resizeObserver.disconnect();
    }, []);

    const absoluteUrl = useMemo(() => {
        if (!url) return '';
        if (/^https?:\/\//i.test(url)) return url;
        if (typeof window !== 'undefined') {
            return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
        }
        return url;
    }, [url]);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setLoading(false);
        setError(null);
        if (onLoadTotalPages) onLoadTotalPages(numPages);
    };

    const onDocumentLoadError = (err: Error) => {
        console.error('[PDFViewer] Load error:', err);
        setLoading(false);
        setError('Failed to load document. The file may be unavailable or corrupted.');
    };

    if (!absoluteUrl || error) {
        return (
            <div className="py-20 text-center max-w-lg mx-auto">
                <AlertTriangle className="mx-auto text-rose-500 mb-6" size={48} />
                <h3 className="text-xl font-black text-slate-900 uppercase font-outfit">Stream Interrupted</h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-4 font-outfit">
                    {error ?? 'No document URL provided.'}
                </p>
            </div>
        );
    }

    return (
        <div className={cn('w-full h-full flex flex-col bg-white', className)} ref={containerRef}>
            <div className="w-full flex-1 relative flex flex-col items-center">
                {/* PDF document area */}
                <div className="w-full overflow-hidden flex justify-center py-6 sm:py-10">
                    <Document
                        file={absoluteUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={onDocumentLoadError}
                        loading={<PDFLoader />}
                        className="max-w-full"
                        options={{
                            // Disable web fonts — cuts memory 30-50% on mobile
                            disableFontFace: true,
                            // Use range requests so PDF.js fetches only needed pages
                            // instead of downloading the whole file upfront
                            rangeChunkSize: 65536,
                            // Disable worker message queue flooding on slow devices
                            maxImageSize: 1024 * 1024 * 4, // 4 MB max decoded image
                        }}
                    >
                        <Page
                            pageNumber={pageNumber}
                            width={Math.max(Math.min(containerWidth * scale, MAX_RENDER_WIDTH), 200)}
                            renderAnnotationLayer={false}
                            renderTextLayer={false}
                            className="shadow-2xl border-none"
                        />
                    </Document>
                </div>

                {/* Floating page navigation — only rendered once page count is known */}
                {numPages > 1 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 sm:gap-4 p-2 sm:p-3 bg-slate-900/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/10 ring-1 ring-black/20">
                        <button
                            onClick={() => onPageChange?.(Math.max(1, pageNumber - 1))}
                            disabled={pageNumber === 1}
                            aria-label="Previous page"
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center bg-white/5 text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft size={18} />
                        </button>

                        <div className="px-3 sm:px-6 flex flex-col items-center min-w-[70px] sm:min-w-[100px]">
                            <p className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
                                Page Progress
                            </p>
                            <p className="text-xs sm:text-sm font-black text-white">
                                {pageNumber} <span className="text-slate-500 mx-1">/</span> {numPages}
                            </p>
                        </div>

                        <button
                            onClick={() => onPageChange?.(pageNumber + 1)}
                            disabled={pageNumber === numPages}
                            aria-label="Next page"
                            className={cn(
                                'w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all bg-white/5 text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed',
                                pageNumber >= docMax && pageNumber < numPages && 'ring-2 ring-indigo-500/50 bg-indigo-500/10'
                            )}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                )}

                {/* Completion card — enough bottom padding so nav bar doesn't overlap */}
                <div className="w-full max-w-4xl mt-24 mb-20 px-4 sm:px-6">
                    {(lessonComplete || (pageNumber === numPages && numPages > 0)) && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                'p-6 sm:p-10 md:p-16 rounded-[2rem] sm:rounded-[3rem] flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-10',
                                lessonComplete
                                    ? 'bg-emerald-500 text-white shadow-2xl shadow-emerald-100'
                                    : 'bg-white border-2 border-slate-100 shadow-2xl'
                            )}
                        >
                            <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-8 text-center sm:text-left">
                                <div
                                    className={cn(
                                        'w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center border-4',
                                        lessonComplete
                                            ? 'bg-white text-emerald-600 border-white/20'
                                            : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                    )}
                                >
                                    {lessonComplete ? <CheckCircle2 size={28} /> : <Eye size={28} />}
                                </div>
                                <div>
                                    <h4 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-1 font-outfit leading-none">
                                        {lessonComplete ? 'Module Mastered' : 'Analysis Complete'}
                                    </h4>
                                    <p
                                        className={cn(
                                            'text-[10px] font-bold uppercase tracking-[0.2em]',
                                            lessonComplete ? 'text-white/70' : 'text-slate-400'
                                        )}
                                    >
                                        {lessonComplete
                                            ? 'Uplink to roadmap successful.'
                                            : 'Finalize the mission to proceed.'}
                                    </p>
                                </div>
                            </div>

                            {!lessonComplete && (
                                <button
                                    onClick={onComplete}
                                    className="w-full lg:w-auto bg-slate-900 text-white px-8 sm:px-12 h-16 sm:h-20 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[11px] hover:bg-indigo-600 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 font-outfit"
                                >
                                    Complete Lesson <ArrowDownCircle size={18} />
                                </button>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>

            <style jsx global>{`
                .react-pdf__Page__canvas {
                    margin: 0 auto !important;
                    display: block !important;
                    max-width: 100% !important;
                    border-radius: 0 !important;
                }
            `}</style>
        </div>
    );
}

function PDFLoader() {
    return (
        <div className="flex flex-col items-center justify-center py-40 gap-6">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin opacity-20" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] animate-pulse">
                Initializing Stream
            </p>
        </div>
    );
}
