'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { cn } from '@/lib/utils';
import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Eye,
    AlertTriangle,
    Loader2,
    ArrowDownCircle,
    ArrowRightCircle,
    ArrowLeftCircle
} from 'lucide-react';

// Use local worker to avoid CDN dependency and CSP issues in production.
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// Static options to avoid re-renders and console warnings in react-pdf
const STABLE_PDF_OPTIONS = {
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/',
    disableFontFace: true,
    rangeChunkSize: 65536,
    maxImageSize: 1024 * 1024 * 4,
};

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
    const MAX_RENDER_WIDTH = 900;
    const [containerWidth, setContainerWidth] = useState<number>(400);
    const scale = 1.0;
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
        setError(null);
        if (onLoadTotalPages) onLoadTotalPages(numPages);
    };

    const onDocumentLoadError = (err: Error) => {
        console.error('[PDFViewer] Load error:', err);
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
            {/* PDF document area with Touch Interaction */}
            <div className="w-full relative group scroll-mt-20" style={{ minHeight: '800px' }}>
                <Document
                    file={absoluteUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={<PDFLoader />}
                    className="flex flex-col items-center py-6 sm:py-10"
                    options={STABLE_PDF_OPTIONS}
                >
                    <div 
                        className="relative touch-none flex flex-col items-center" 
                        style={{ minHeight: containerWidth ? `${containerWidth * 1.41}px` : '700px' }}
                    >
                            <Page
                                pageNumber={pageNumber}
                                width={Math.max(Math.min(containerWidth * scale, MAX_RENDER_WIDTH), 200)}
                                renderAnnotationLayer={false}
                                renderTextLayer={false}
                                className="shadow-2xl border-none pointer-events-none select-none"
                            />

                            {/* Interactive Touch Zones */}
                            <div className="absolute inset-y-0 left-0 w-1/4 hidden md:flex items-center justify-start pl-8 opacity-0 group-hover:opacity-100">
                                {pageNumber > 1 && (
                                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white">
                                        <ArrowLeftCircle size={32} />
                                    </div>
                                )}
                            </div>
                            <div className="absolute inset-y-0 right-0 w-1/4 hidden md:flex items-center justify-end pr-8 opacity-0 group-hover:opacity-100">
                                {pageNumber < numPages && (
                                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white">
                                        <ArrowRightCircle size={32} />
                                    </div>
                                )}
                            </div>
                        </div>
                </Document>

                <div className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900/40 backdrop-blur-md rounded-full border border-white/10 pointer-events-none flex items-center gap-2">
                    <span className="text-[8px] font-black text-white/50 uppercase tracking-widest">Swipe for Next Page</span>
                </div>
            </div>

            {/* Floating page navigation */}
            {numPages > 1 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 sm:gap-4 p-2 sm:p-3 bg-slate-900/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/10 ring-1 ring-black/20">
                    <button
                        onClick={() => onPageChange?.(Math.max(1, pageNumber - 1))}
                        disabled={pageNumber === 1}
                        aria-label="Previous page"
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center bg-white/5 text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed"
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
                            'w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center bg-white/5 text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed',
                            pageNumber >= docMax && pageNumber < numPages && 'ring-2 ring-indigo-500/50 bg-indigo-500/10'
                        )}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}

            {/* Completion Section - More Compact & Natural */}
            
        </div>
    );
}

function PDFLoader() {
    return (
        <div className="flex flex-col items-center justify-center py-40 gap-6">
            <Loader2 className="w-12 h-12 text-indigo-600 opacity-20" />
        </div>
    );
}
