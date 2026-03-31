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
    ExternalLink,
    Maximize,
    Minimize,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Worker is copied from node_modules/pdfjs-dist at build/dev-start time by next.config.ts.
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const STABLE_PDF_OPTIONS = {
    cMapUrl: '/pdfjs-cmaps/',
    cMapPacked: true,
    standardFontDataUrl: '/pdfjs-fonts/',
    disableFontFace: true,
    rangeChunkSize: 65536,
    maxImageSize: 1024 * 1024 * 4,
};

const MAX_RENDER_WIDTH = 1100;
const DEFAULT_PAGE_HEIGHT = 800;

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
    const [retryKey, setRetryKey] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    // Store page dimensions
    const [pageDimensions, setPageDimensions] = useState<Map<number, { width: number; height: number }>>(new Map());

    // Virtualization: tracks which page numbers have been "activated" for rendering.
    // Pages are added as they approach the viewport; never removed (avoids re-render on scroll-back).
    const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([1]));

    const containerRef = useRef<HTMLDivElement>(null);
    const completedRef = useRef(false);
    const pageObserverRef = useRef<IntersectionObserver | null>(null);
    const pagePlaceholderRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    // Measure container width with debounce to prevent excessive re-renders
    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                const w = containerRef.current.offsetWidth;
                if (w > 0) setContainerWidth(Math.min(w, MAX_RENDER_WIDTH));
            }
        };
        const debouncedUpdateWidth = () => {
            if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
            resizeTimerRef.current = setTimeout(updateWidth, 150);
        };
        const ro = new ResizeObserver(debouncedUpdateWidth);
        if (containerRef.current) ro.observe(containerRef.current);
        updateWidth(); // immediate measurement on mount (not debounced)
        return () => {
            ro.disconnect();
            if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
        };
    }, []);

    // Set up IntersectionObserver to lazy-activate pages as they approach the viewport.
    // rootMargin of 200% pre-loads one "screen-height" above and below the visible area.
    useEffect(() => {
        if (numPages === 0) return;

        pageObserverRef.current?.disconnect();

        pageObserverRef.current = new IntersectionObserver(
            (entries) => {
                const toAdd: number[] = [];
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        const pageNum = Number((entry.target as HTMLElement).dataset.pageNum);
                        if (pageNum > 0) toAdd.push(pageNum);
                    }
                }
                if (toAdd.length > 0) {
                    setVisiblePages(prev => {
                        const next = new Set(prev);
                        toAdd.forEach(n => next.add(n));
                        return next;
                    });
                }
            },
            { rootMargin: '200% 0px', threshold: 0 }
        );

        // Observe all currently-registered placeholder divs
        pagePlaceholderRefs.current.forEach(el => {
            pageObserverRef.current?.observe(el);
        });

        return () => { pageObserverRef.current?.disconnect(); };
    }, [numPages]);

    const absoluteUrl = useMemo(() => {
        if (!url) return '';
        if (/^https?:\/\//i.test(url)) return url;
        if (typeof window !== 'undefined') {
            return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
        }
        return url;
    }, [url]);

    const fileOptions = useMemo(() => {
        const isSameOrigin =
            !absoluteUrl ||
            !absoluteUrl.startsWith('http') ||
            (typeof window !== 'undefined' && absoluteUrl.startsWith(window.location.origin));
        return { ...STABLE_PDF_OPTIONS, withCredentials: isSameOrigin };
    }, [absoluteUrl]);

    useEffect(() => {
        completedRef.current = false;
        setError(null);
        setNumPages(0);
        setPageDimensions(new Map());
        setVisiblePages(new Set([1]));
        pagePlaceholderRefs.current.clear();
        pageObserverRef.current?.disconnect();
        pageObserverRef.current = null;
    }, [url]);

    // Exit fullscreen on Escape key
    useEffect(() => {
        if (!isFullscreen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsFullscreen(false);
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

    // Lock body scroll when in fullscreen to prevent background scroll drift
    useEffect(() => {
        document.body.style.overflow = isFullscreen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isFullscreen]);

    const handleRetry = useCallback(() => {
        setError(null);
        setNumPages(0);
        setPageDimensions(new Map());
        setRetryKey(k => k + 1);
    }, []);

    const onDocumentLoadSuccess = ({ numPages: n }: { numPages: number }) => {
        setNumPages(n);
        setError(null);
        onLoadTotalPages?.(n);
        if (n === 1 && !completedRef.current) {
            completedRef.current = true;
            onComplete();
        }
    };

    const onDocumentLoadError = (err: Error) => {
        console.error('PDF Load Error:', err);
        setError('Could not load the document. You can try opening it directly in your browser.');
    };

    const onPageLoadSuccess = (page: any) => {
        const { width, height, pageNumber: pNum } = page;
        setPageDimensions(prev => {
            const next = new Map(prev);
            next.set(pNum, { width, height });
            return next;
        });
    };

    const getPageHeight = useCallback((index: number) => {
        const dim = pageDimensions.get(index + 1);
        if (dim) {
            const scale = containerWidth / dim.width;
            return dim.height * scale;
        }
        return DEFAULT_PAGE_HEIGHT;
    }, [pageDimensions, containerWidth]);

    if (!absoluteUrl) return null;

    return (
        <div 
            className={cn(
                'w-full flex flex-col bg-slate-50 relative',
                isFullscreen ? 'fixed inset-0 z-[200] max-w-none' : 'rounded-3xl overflow-hidden border border-slate-100 shadow-sm',
                className
            )} 
            ref={containerRef}
        >
            {/* Header / Tools */}
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Page {pageNumber} / {numPages || '…'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <a 
                        href={absoluteUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        title="Open in Browser"
                    >
                        <ExternalLink size={18} />
                    </a>
                    <button 
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    >
                        {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                    </button>
                    {!lessonComplete && pageNumber === numPages && numPages > 0 && (
                        <button
                            onClick={() => {
                                if (!completedRef.current) {
                                    completedRef.current = true;
                                    onComplete();
                                }
                            }}
                            className="ml-2 px-5 py-2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                        >
                            Mark Complete
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-[500px] h-[75vh] bg-slate-200/50 relative overflow-hidden">
                {error ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-white">
                        <AlertTriangle className="text-rose-500 mb-6" size={48} />
                        <h3 className="text-xl font-black text-slate-900 uppercase">Load Failure</h3>
                        <p className="text-sm text-slate-500 font-medium mt-2 mb-8 max-w-sm">
                            {error}
                        </p>
                        <div className="flex gap-3">
                            <button onClick={handleRetry} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <RefreshCw size={14} /> Retry
                            </button>
                            <a href={absoluteUrl} target="_blank" className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <ExternalLink size={14} /> Open Native
                            </a>
                        </div>
                    </div>
                ) : (
                    <Document
                        key={`${absoluteUrl}-${retryKey}`}
                        file={absoluteUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={onDocumentLoadError}
                        loading={<div className="absolute inset-0 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600 opacity-20" size={48} /></div>}
                        options={fileOptions}
                    >
                        {numPages > 0 && (
                            <div className="h-full overflow-y-auto no-scrollbar scroll-smooth p-4 space-y-6 flex flex-col items-center">
                                {Array.from({ length: numPages }, (_, index) => {
                                    const pageNum = index + 1;
                                    const shouldRender = visiblePages.has(pageNum);
                                    return (
                                        <div
                                            key={`page_${pageNum}`}
                                            data-page-num={pageNum}
                                            ref={(el) => {
                                                if (el) {
                                                    pagePlaceholderRefs.current.set(pageNum, el);
                                                    pageObserverRef.current?.observe(el);
                                                } else {
                                                    pagePlaceholderRefs.current.delete(pageNum);
                                                }
                                            }}
                                            className="shadow-2xl rounded-sm overflow-hidden bg-white"
                                            style={{ minHeight: getPageHeight(index) }}
                                        >
                                            {shouldRender ? (
                                                <Page
                                                    pageNumber={pageNum}
                                                    width={containerWidth}
                                                    renderAnnotationLayer={false}
                                                    renderTextLayer={false}
                                                    onLoadSuccess={onPageLoadSuccess}
                                                    loading={
                                                        <div
                                                            style={{ width: containerWidth, height: getPageHeight(index) }}
                                                            className="bg-slate-50 animate-pulse"
                                                        />
                                                    }
                                                />
                                            ) : (
                                                <div
                                                    style={{ width: containerWidth, height: getPageHeight(index) }}
                                                    className="bg-slate-50"
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Document>
                )}
            </div>

            {/* Continuous progress indicator */}
            {numPages > 1 && (
                <div className="h-1.5 w-full bg-slate-100">
                    <motion.div 
                        className="h-full bg-indigo-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${(pageNumber / numPages) * 100}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            )}
        </div>
    );
}
