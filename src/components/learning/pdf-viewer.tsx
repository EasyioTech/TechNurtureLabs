'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { cn } from '@/lib/utils';
import {
    AlertTriangle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// Use the locally served worker (copied from node_modules at build time by next.config.ts).
// This version is guaranteed to match the installed pdfjs-dist — no CDN dependency.
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// cMapUrl and standardFontDataUrl must match the installed pdfjs-dist version.
// next.config.ts copies the worker from that same version so they are in sync.
// The version constant is kept here so it only needs to be updated once.
const PDFJS_VERSION = pdfjs.version; // read from the live bundle — always correct
const STABLE_PDF_OPTIONS = {
    cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/standard_fonts/`,
    disableFontFace: true,
    rangeChunkSize: 65536,
    maxImageSize: 1024 * 1024 * 4,
    withCredentials: true,
};

const MAX_RENDER_WIDTH = 900;

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
    const [containerWidth, setContainerWidth] = useState<number>(400);
    const [error, setError] = useState<string | null>(null);
    // Direction hint for page-turn animation: +1 = forward, -1 = backward
    const [slideDir, setSlideDir] = useState<1 | -1>(1);

    const containerRef = useRef<HTMLDivElement>(null);
    // Prevent calling onComplete more than once per document
    const completedRef = useRef(false);
    // Touch tracking for swipe gesture
    const touchStartX = useRef<number>(0);
    const touchStartY = useRef<number>(0);

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

    // Reset completion flag when the document URL changes
    useEffect(() => {
        completedRef.current = false;
    }, [url]);

    const onDocumentLoadSuccess = ({ numPages: n }: { numPages: number }) => {
        setNumPages(n);
        setError(null);
        onLoadTotalPages?.(n);
        // Single-page document: complete immediately — nothing to navigate
        if (n === 1 && !completedRef.current) {
            completedRef.current = true;
            onComplete();
        }
    };

    const onDocumentLoadError = (err: Error) => {
        console.error('[PDFViewer] Load error:', err);
        setError('Failed to load document. The file may be unavailable or corrupted.');
    };

    const handleNextPage = () => {
        if (pageNumber < numPages) {
            setSlideDir(1);
            onPageChange?.(pageNumber + 1);
        }
    };

    const handlePrevPage = () => {
        if (pageNumber > 1) {
            setSlideDir(-1);
            onPageChange?.(pageNumber - 1);
        }
    };

    // Native touch handlers — reliable cross-browser swipe detection
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        const deltaX = e.changedTouches[0].clientX - touchStartX.current;
        const deltaY = e.changedTouches[0].clientY - touchStartY.current;
        // Only count as horizontal swipe if x movement dominates and > 40px
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
            if (deltaX < 0) handleNextPage();
            else handlePrevPage();
        }
    };

    // Rendered page width — capped at MAX_RENDER_WIDTH and container width
    const pageWidth = Math.max(Math.min(containerWidth, MAX_RENDER_WIDTH), 200);

    if (!absoluteUrl || error) {
        return (
            <div className="py-20 text-center max-w-lg mx-auto">
                <AlertTriangle className="mx-auto text-rose-500 mb-6" size={48} />
                <h3 className="text-xl font-black text-slate-900 uppercase">Stream Interrupted</h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-4">
                    {error ?? 'No document URL provided.'}
                </p>
            </div>
        );
    }

    return (
        <div className={cn('w-full flex flex-col bg-white', className)} ref={containerRef}>
            {/* PDF page area — height is natural (driven by aspect ratio of each page) */}
            <div className="w-full relative group">
                <Document
                    file={absoluteUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={<PDFLoader />}
                    className="flex flex-col items-center py-4 sm:py-8"
                    options={STABLE_PDF_OPTIONS}
                >
                    {/* Swipe wrapper — natural height, native touch */}
                    <div
                        className="relative w-full flex justify-center overflow-hidden"
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        style={{ touchAction: 'pan-y' }}
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={pageNumber}
                                initial={{ opacity: 0, x: slideDir * 60 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: slideDir * -60 }}
                                transition={{ duration: 0.22, ease: 'easeInOut' }}
                                className="w-full flex justify-center"
                            >
                                {/*
                                 * Pass only `width` — react-pdf derives height from the page's
                                 * own aspect ratio (including rotation metadata). This correctly
                                 * handles landscape pages without needing any manual height calc.
                                 */}
                                <Page
                                    pageNumber={pageNumber}
                                    width={pageWidth}
                                    renderAnnotationLayer={false}
                                    renderTextLayer={false}
                                    className="shadow-2xl select-none"
                                />
                            </motion.div>
                        </AnimatePresence>

                        {/* Desktop hover navigation overlays */}
                        {pageNumber > 1 && (
                            <button
                                onClick={handlePrevPage}
                                aria-label="Previous page"
                                className="absolute inset-y-0 left-0 w-16 hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <div className="w-10 h-10 rounded-full bg-slate-900/30 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-slate-900/50 transition-colors">
                                    <ChevronLeft size={22} />
                                </div>
                            </button>
                        )}
                        {pageNumber < numPages && (
                            <button
                                onClick={handleNextPage}
                                aria-label="Next page"
                                className="absolute inset-y-0 right-0 w-16 hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <div className="w-10 h-10 rounded-full bg-slate-900/30 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-slate-900/50 transition-colors">
                                    <ChevronRight size={22} />
                                </div>
                            </button>
                        )}
                    </div>
                </Document>

            </div>

            {/* Inline page navigation — not fixed, stays within the lesson view */}
            {numPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-white">
                    {/* Prev */}
                    <button
                        onClick={handlePrevPage}
                        disabled={pageNumber === 1}
                        aria-label="Previous page"
                        className="w-9 h-9 rounded-xl flex items-center justify-center border border-slate-200 text-slate-500 disabled:opacity-25 hover:bg-slate-50 transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>

                    {/* Progress */}
                    <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Page {pageNumber} of {numPages}
                        </span>
                        {/* Mini progress bar */}
                        <div className="w-24 h-1 rounded-full bg-slate-100 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                                style={{ width: `${(pageNumber / numPages) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Next OR Mark Complete */}
                    {pageNumber < numPages ? (
                        <button
                            onClick={handleNextPage}
                            aria-label="Next page"
                            className="w-9 h-9 rounded-xl flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    ) : lessonComplete ? (
                        <div className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wide border border-emerald-100">
                            <CheckCircle2 size={12} /> Done
                        </div>
                    ) : (
                        <button
                            onClick={() => {
                                if (!completedRef.current) {
                                    completedRef.current = true;
                                    onComplete();
                                }
                            }}
                            className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wide hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20"
                        >
                            <CheckCircle2 size={12} /> Mark Complete
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

function PDFLoader() {
    return (
        <div className="flex flex-col items-center justify-center py-40 gap-6">
            <Loader2 className="w-12 h-12 text-indigo-600 opacity-20 animate-spin" />
        </div>
    );
}
