'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
// @ts-ignore - VariableSizeList is a valid member but sometimes types are misaligned in certain environments
import { VariableSizeList as List } from 'react-window';
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
    
    // Store page dimensions for virtualization
    const [pageDimensions, setPageDimensions] = useState<Map<number, { width: number; height: number }>>(new Map());
    
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<List>(null);
    const completedRef = useRef(false);
    
    // Virtualization scroll handling
    const onItemsRendered = useCallback(({ visibleStartIndex }: { visibleStartIndex: number }) => {
        const currentPage = visibleStartIndex + 1;
        if (currentPage !== pageNumber) {
            onPageChange?.(currentPage);
        }
    }, [pageNumber, onPageChange]);

    // Sync scroll position when pageNumber changes from parent (e.g. syllabus click)
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollToItem(pageNumber - 1, 'start');
        }
    }, [pageNumber]);

    // Measure container width
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
    }, [url]);

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
        if (listRef.current) {
            listRef.current.resetAfterIndex(pNum - 1);
        }
    };

    const getPageHeight = useCallback((index: number) => {
        const dim = pageDimensions.get(index + 1);
        if (dim) {
            const scale = containerWidth / dim.width;
            return dim.height * scale;
        }
        return DEFAULT_PAGE_HEIGHT;
    }, [pageDimensions, containerWidth]);

    const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
        <div style={style} className="flex justify-center py-4">
            <Page
                pageNumber={index + 1}
                width={containerWidth}
                onLoadSuccess={onPageLoadSuccess}
                loading={<div style={{ height: getPageHeight(index) }} className="bg-slate-50 animate-pulse rounded-lg" />}
                renderAnnotationLayer={false}
                renderTextLayer={false}
                className="shadow-xl"
            />
        </div>
    );

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
                            <List
                                ref={listRef}
                                height={isFullscreen ? window.innerHeight - 60 : 600}
                                itemCount={numPages}
                                itemSize={getPageHeight}
                                width="100%"
                                onItemsRendered={onItemsRendered}
                                className="no-scrollbar"
                            >
                                {Row}
                            </List>
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
