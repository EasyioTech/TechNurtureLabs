'use client';

/**
 * PPT Viewer — Image-based slide presentation viewer.
 *
 * On upload, the server converts the PPTX → PDF → PNG images (one per slide).
 * This component fetches those pre-generated images and displays them as
 * a slide-by-slide viewer. No browser-side office library required.
 *
 * The component polls /api/media/pptx-slides/[assetId] while the server is
 * still processing, then shows slides once ready.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Loader2,
    AlertTriangle,
    Download,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Eye,
    ArrowDownCircle,
    RefreshCw,
} from 'lucide-react';

interface Slide {
    index: number;
    url: string;
}

type SlideState =
    | { status: 'loading' }
    | { status: 'processing' }
    | { status: 'ready'; slides: Slide[]; total: number }
    | { status: 'error'; message: string };

interface PPTViewerProps {
    url: string;
    assetId?: string | null;
    onComplete: () => void;
    lessonComplete: boolean;
    pageNumber: number;
    docMax: number;
    onLoadTotalPages?: (n: number) => void;
    onPageChange?: (n: number) => void;
    className?: string;
    canMarkComplete?: boolean;
}

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_TRIES = 40; // ~2 minutes max

export function PPTViewer({
    url,
    assetId,
    onComplete,
    lessonComplete,
    pageNumber,
    docMax,
    onLoadTotalPages,
    onPageChange,
    className,
    canMarkComplete = true,
}: PPTViewerProps) {
    const [state, setState] = useState<SlideState>({ status: 'loading' });
    const pollCount = useRef(0);
    const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchSlides = useCallback(async () => {
        if (!assetId) {
            setState({
                status: 'error',
                message: 'This presentation was added via an external link and cannot be rendered inline. Re-upload the file to enable slide view.',
            });
            return;
        }

        try {
            const res = await fetch(`/api/media/pptx-slides/${assetId}`);
            if (!res.ok) {
                const text = await res.text().catch(() => '');
                setState({ status: 'error', message: text || `Server error (${res.status})` });
                return;
            }

            const data = await res.json();

            if (data.status === 'completed') {
                setState({ status: 'ready', slides: data.slides, total: data.total });
                onLoadTotalPages?.(data.total);
                return;
            }

            if (data.status === 'failed') {
                setState({ status: 'error', message: data.error ?? 'Slide conversion failed.' });
                return;
            }

            // Still processing — poll again
            setState({ status: 'processing' });
            pollCount.current += 1;

            if (pollCount.current < POLL_MAX_TRIES) {
                pollTimerRef.current = setTimeout(fetchSlides, POLL_INTERVAL_MS);
            } else {
                setState({ status: 'error', message: 'Slide conversion is taking too long. Please try refreshing the page.' });
            }
        } catch (err: any) {
            setState({ status: 'error', message: err?.message ?? 'Failed to load slides.' });
        }
    }, [assetId, onLoadTotalPages]);

    useEffect(() => {
        pollCount.current = 0;
        fetchSlides();
        return () => {
            if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
        };
    }, [fetchSlides]);

    // ── Loading / processing ──────────────────────────────────────────────────
    if (state.status === 'loading' || state.status === 'processing') {
        return (
            <div className={cn('w-full flex flex-col items-center justify-center py-40 gap-6', className)}>
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin opacity-50" />
                <div className="text-center space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] animate-pulse">
                        {state.status === 'processing' ? 'Converting Slides' : 'Loading Presentation'}
                    </p>
                    {state.status === 'processing' && (
                        <p className="text-[10px] text-slate-300">
                            This runs once per presentation — subsequent loads are instant.
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // ── Error ─────────────────────────────────────────────────────────────────
    if (state.status === 'error') {
        const isLibreOfficeError = state.message.toLowerCase().includes('libreoffice');
        const canRetry = Boolean(assetId);

        const handleRetry = async () => {
            if (!assetId) return;
            setState({ status: 'loading' });
            try {
                await fetch(`/api/media/pptx-process/${assetId}`, { method: 'POST' });
            } catch (_) {}
            pollCount.current = 0;
            fetchSlides();
        };

        return (
            <div className={cn('w-full py-20 text-center max-w-lg mx-auto px-6', className)}>
                <AlertTriangle className="mx-auto text-rose-500 mb-6" size={48} />
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight font-outfit">
                    Presentation Unavailable
                </h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-4 font-outfit leading-relaxed">
                    {state.message}
                </p>

                {isLibreOfficeError && (
                    <div className="mt-6 text-left bg-amber-50 border border-amber-200 rounded-2xl p-5">
                        <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-3">
                            Install LibreOffice to enable conversion
                        </p>
                        <code className="block text-[11px] text-slate-700 bg-white border border-slate-200 rounded-xl px-4 py-3 font-mono leading-relaxed">
                            <span className="text-slate-400"># Windows</span>
                            <br />
                            winget install LibreOffice.LibreOffice
                            <br /><br />
                            <span className="text-slate-400"># Linux / Docker</span>
                            <br />
                            apt-get install libreoffice-impress
                        </code>
                        <p className="text-[10px] text-amber-600 mt-3">
                            After installing, click Retry below — no re-upload needed.
                        </p>
                    </div>
                )}

                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                    {canRetry && (
                        <button
                            onClick={handleRetry}
                            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-indigo-700 transition-all shadow-xl font-outfit"
                        >
                            <RefreshCw size={14} /> Retry Conversion
                        </button>
                    )}
                    {url && (
                        <a
                            href={url}
                            download
                            className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-700 transition-all shadow-xl font-outfit"
                        >
                            <Download size={14} /> Download File
                        </a>
                    )}
                </div>
            </div>
        );
    }

    // ── Slides ready ─────────────────────────────────────────────────────────
    const { slides, total } = state;
    const currentSlide = slides[pageNumber - 1] ?? slides[0];

    return (
        <div className={cn('w-full flex flex-col bg-white', className)}>
            {/* Slide image */}
            <div className="w-full flex justify-center py-6 sm:py-10 px-4">
                <div className="w-full max-w-4xl">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pageNumber}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                            className="w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-100 bg-slate-50"
                        >
                            <SlideImage
                                url={currentSlide.url}
                                index={currentSlide.index}
                            />
                        </motion.div>
                    </AnimatePresence>

                    {/* Slide counter pill */}
                    <div className="mt-4 flex items-center justify-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-4 py-1.5 rounded-full">
                            Slide {pageNumber} / {total}
                        </span>
                    </div>
                </div>
            </div>

            {/* Floating prev / next — only shown when there is more than one slide */}
            {total > 1 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 sm:gap-4 p-2 sm:p-3 bg-slate-900/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/10">
                    <button
                        onClick={() => onPageChange?.(Math.max(1, pageNumber - 1))}
                        disabled={pageNumber === 1}
                        aria-label="Previous slide"
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center bg-white/5 text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronLeft size={18} />
                    </button>

                    <div className="px-3 sm:px-6 flex flex-col items-center min-w-[70px] sm:min-w-[100px]">
                        <p className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
                            Slide Progress
                        </p>
                        <p className="text-xs sm:text-sm font-black text-white">
                            {pageNumber} <span className="text-slate-500 mx-1">/</span> {total}
                        </p>
                    </div>

                    <button
                        onClick={() => onPageChange?.(pageNumber + 1)}
                        disabled={pageNumber === total}
                        aria-label="Next slide"
                        className={cn(
                            'w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all bg-white/5 text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed',
                            pageNumber >= docMax && pageNumber < total && 'ring-2 ring-indigo-500/50 bg-indigo-500/10'
                        )}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}

            {/* Completion card */}
            <div className="w-full max-w-4xl mx-auto mt-24 mb-20 px-4 sm:px-6">
                {(lessonComplete || (pageNumber === total && total > 0)) && (
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
                                    {lessonComplete ? 'Presentation Mastered' : 'Slides Complete'}
                                </h4>
                                <p
                                    className={cn(
                                        'text-[10px] font-bold uppercase tracking-[0.2em]',
                                        lessonComplete ? 'text-white/70' : 'text-slate-400'
                                    )}
                                >
                                    {lessonComplete
                                        ? 'Strategic insights synchronized with your profile.'
                                        : 'Finalize the mission to unlock rewards.'}
                                </p>
                            </div>
                        </div>

                        {!lessonComplete && canMarkComplete && (
                            <button
                                id="ppt-complete-button"
                                onClick={onComplete}
                                className="w-full lg:w-auto bg-slate-900 text-white px-8 sm:px-12 h-16 sm:h-20 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[11px] hover:bg-indigo-600 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 font-outfit"
                            >
                                Complete Lesson <ArrowDownCircle size={18} />
                            </button>
                        )}
                        {!lessonComplete && !canMarkComplete && (
                            <div className="w-full lg:w-auto bg-slate-100 text-slate-400 px-8 sm:px-12 h-16 sm:h-20 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 border border-slate-200 cursor-not-allowed">
                                Mission Locked <Loader2 className="animate-spin" size={18} />
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            <style jsx global>{`
                .font-outfit { font-family: 'Outfit', sans-serif; }
            `}</style>
        </div>
    );
}

/** Single slide image with skeleton loader */
function SlideImage({ url, index }: { url: string; index: number }) {
    const [loaded, setLoaded] = useState(false);
    const [errored, setErrored] = useState(false);

    return (
        <div className="relative w-full h-full">
            {!loaded && !errored && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                    <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
                </div>
            )}
            {errored ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 gap-3">
                    <AlertTriangle size={28} className="text-slate-300" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Slide {index} unavailable
                    </span>
                </div>
            ) : (
                <img
                    src={url}
                    alt={`Slide ${index}`}
                    className={cn(
                        'w-full h-full object-contain transition-opacity duration-300',
                        loaded ? 'opacity-100' : 'opacity-0'
                    )}
                    onLoad={() => setLoaded(true)}
                    onError={() => { setLoaded(true); setErrored(true); }}
                    draggable={false}
                />
            )}
        </div>
    );
}
