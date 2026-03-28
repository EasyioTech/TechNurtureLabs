'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
    RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Worker is copied from node_modules/pdfjs-dist at build/dev-start time by next.config.ts.
// This guarantees the worker version exactly matches the installed pdfjs-dist — no mismatch possible.
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// ── Local asset paths ────────────────────────────────────────────────────────
// cMaps and standard_fonts are copied from node_modules/pdfjs-dist to public/ by
// next.config.ts on every build/dev start.  Serving them from our own origin
// eliminates ALL CDN dependencies (jsDelivr, unpkg, etc.) — PDFs load correctly
// even on school networks that block external CDNs.
const STABLE_PDF_OPTIONS = {
    cMapUrl: '/pdfjs-cmaps/',
    cMapPacked: true,
    standardFontDataUrl: '/pdfjs-fonts/',
    // Disable CSS @font-face injection — canvas-based font rendering is more
    // consistent across devices, especially on older Android WebViews.
    disableFontFace: true,
    // 64 KB chunks: PDF.js fetches the document in pieces for range-request support.
    // Smaller chunks mean faster first-page render on slow connections.
    rangeChunkSize: 65536,
    // 4 MB max image size per page — prevent OOM on low-memory devices
    maxImageSize: 1024 * 1024 * 4,
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
    // Incrementing this key forces <Document> to unmount and remount on retry,
    // which cancels any in-flight fetch and starts a completely fresh load.
    const [retryKey, setRetryKey] = useState(0);
    // Direction hint for page-turn animation: +1 = forward, -1 = backward
    const [slideDir, setSlideDir] = useState<1 | -1>(1);

    const containerRef = useRef<HTMLDivElement>(null);
    // Prevent calling onComplete more than once per document
    const completedRef = useRef(false);
    // Touch tracking for swipe gesture
    const touchStartX = useRef<number>(0);
    const touchStartY = useRef<number>(0);

    // Measure container width for responsive page rendering
    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                const w = containerRef.current.offsetWidth;
                if (w > 0) setContainerWidth(Math.min(w, MAX_RENDER_WIDTH));
            }
        };
        const ro = new ResizeObserver(updateWidth);
        if (containerRef.current) ro.observe(containerRef.current);
        updateWidth();
        return () => ro.disconnect();
    }, []);

    // Resolve relative URLs to absolute — PDF.js needs a fully qualified URL
    // to correctly determine the origin for CORS and range-request handling.
    const absoluteUrl = useMemo(() => {
        if (!url) return '';
        if (/^https?:\/\//i.test(url)) return url;
        if (typeof window !== 'undefined') {
            return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
        }
        return url;
    }, [url]);

    // ── withCredentials: same-origin only ────────────────────────────────────
    // Our auth-proxy routes (/api/media/...) require the session cookie — they are
    // same-origin requests so withCredentials: true works fine.
    //
    // Direct R2 / CDN URLs are cross-origin.  Setting withCredentials: true on a
    // cross-origin request triggers a CORS preflight that R2 cannot satisfy, which
    // causes every PDF on a CDN-hosted bucket to fail with a CORS error.
    //
    // Fix: only enable withCredentials when the URL shares our origin.
    const fileOptions = useMemo(() => {
        const isSameOrigin =
            !absoluteUrl ||
            !absoluteUrl.startsWith('http') ||
            (typeof window !== 'undefined' && absoluteUrl.startsWith(window.location.origin));
        return { ...STABLE_PDF_OPTIONS, withCredentials: isSameOrigin };
    }, [absoluteUrl]);

    // Reset state whenever the source document changes
    useEffect(() => {
        completedRef.current = false;
        setError(null);
        setNumPages(0);
        setRetryKey(0);
    }, [url]);

    // Retry: clear error and remount <Document> with a fresh key
    const handleRetry = useCallback(() => {
        setError(null);
        setNumPages(0);
        setRetryKey(k => k + 1);
    }, []);

    const onDocumentLoadSuccess = ({ numPages: n }: { numPages: number }) => {
        setNumPages(n);
        setError(null);
        onLoadTotalPages?.(n);
        // Single-page document: mark complete immediately
        if (n === 1 && !completedRef.current) {
            completedRef.current = true;
            onComplete();
        }
    };

    const onDocumentLoadError = (err: Error) => {
        const msg = (err?.message || '').toLowerCase();
        let friendly: string;
        if (msg.includes('401') || msg.includes('403') || msg.includes('unauthori')) {
            friendly = 'Your session has expired. Please refresh the page and try again.';
        } else if (msg.includes('404') || msg.includes('not found')) {
            friendly = 'Document not found. Please contact your administrator.';
        } else if (
            msg.includes('network') ||
            msg.includes('fetch') ||
            msg.includes('failed to fetch') ||
            msg.includes('load failed')
        ) {
            friendly = 'Network error — check your internet connection and tap Retry.';
        } else if (msg.includes('worker')) {
            friendly = 'PDF engine failed to load. Please refresh the page.';
        } else {
            friendly = 'Could not load the document. Tap Retry to try again.';
        }
        setError(friendly);
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

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        const deltaX = e.changedTouches[0].clientX - touchStartX.current;
        const deltaY = e.changedTouches[0].clientY - touchStartY.current;
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
            if (deltaX < 0) handleNextPage();
            else handlePrevPage();
        }
    };

    const pageWidth = Math.max(Math.min(containerWidth, MAX_RENDER_WIDTH), 200);

    // ── Missing URL ──────────────────────────────────────────────────────────
    if (!absoluteUrl) {
        return (
            <div className="py-20 text-center max-w-lg mx-auto px-6">
                <AlertTriangle className="mx-auto text-rose-500 mb-6" size={48} />
                <h3 className="text-xl font-black text-slate-900 uppercase">No Document</h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-4">
                    No document URL was provided for this lesson.
                </p>
            </div>
        );
    }

    // ── Load error with Retry ────────────────────────────────────────────────
    if (error) {
        return (
            <div className="py-20 text-center max-w-lg mx-auto px-6">
                <AlertTriangle className="mx-auto text-rose-500 mb-6" size={48} />
                <h3 className="text-xl font-black text-slate-900 uppercase mb-4">Document Unavailable</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8 max-w-sm mx-auto">
                    {error}
                </p>
                <button
                    onClick={handleRetry}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                >
                    <RefreshCw size={15} /> Retry
                </button>
            </div>
        );
    }

    return (
        <div className={cn('w-full flex flex-col bg-white', className)} ref={containerRef}>
            <div className="w-full relative group">
                {/*
                 * key={`${absoluteUrl}-${retryKey}`} ensures:
                 *   - A new URL always starts a fresh Document (no stale state)
                 *   - Retry increments retryKey which remounts and re-fetches
                 */}
                <Document
                    key={`${absoluteUrl}-${retryKey}`}
                    file={absoluteUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={<PDFLoader />}
                    className="w-full"
                    options={fileOptions}
                >
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
                                 * Only pass `width` — react-pdf derives height from the page's
                                 * own aspect ratio metadata.  This correctly handles landscape
                                 * pages without any manual height calculation.
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

                        {/* Desktop hover-nav overlays */}
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

            {/* Bottom page navigation — only shown when document has multiple pages */}
            {numPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-white">
                    <button
                        onClick={handlePrevPage}
                        disabled={pageNumber === 1}
                        aria-label="Previous page"
                        className="w-9 h-9 rounded-xl flex items-center justify-center border border-slate-200 text-slate-500 disabled:opacity-25 hover:bg-slate-50 transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>

                    <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Page {pageNumber} of {numPages}
                        </span>
                        <div className="w-24 h-1 rounded-full bg-slate-100 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                                style={{ width: `${(pageNumber / numPages) * 100}%` }}
                            />
                        </div>
                    </div>

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
