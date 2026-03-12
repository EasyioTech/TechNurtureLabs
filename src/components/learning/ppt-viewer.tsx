'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
    MonitorPlay,
    ExternalLink,
    CheckCircle2,
    ChevronRight,
    Maximize2,
    Presentation,
    AlertTriangle
} from 'lucide-react';

interface PPTViewerProps {
    url: string;
    onComplete: () => void;
    lessonComplete: boolean;
    isFocusMode?: boolean;
    className?: string;
}

/**
 * Premium Slideshow Viewer for PPTX and Presentations.
 * Optimized for Cinematic Zen immersion.
 */
export function PPTViewer({ url, onComplete, lessonComplete, isFocusMode, className }: PPTViewerProps) {
    const [loaded, setLoaded] = useState(false);

    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const absoluteUrl = url.startsWith('http') ? url : (typeof window !== 'undefined' ? window.location.origin + url : url);
    const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(absoluteUrl)}&embedded=true`;

    return (
        <div className={cn("space-y-12 w-full transition-all duration-1000", className)}>
            <div className={cn(
                "relative w-full bg-slate-900 rounded-[3.5rem] overflow-hidden border transition-all duration-1000 h-[80vh]",
                isFocusMode ? "border-white/10 shadow-[0_0_120px_-20px_rgba(79,70,229,0.3)] scale-[1.02]" : "border-slate-200/50 shadow-2xl shadow-indigo-900/10"
            )}>
                {!isLocal ? (
                    <iframe
                        src={viewerUrl}
                        className={cn(
                            "w-full h-full relative z-10 border-0 transition-opacity duration-1000",
                            loaded ? "opacity-100" : "opacity-0"
                        )}
                        onLoad={() => setLoaded(true)}
                        allowFullScreen
                        title="Presentation Viewer"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-30 p-12 text-center">
                        <div className="max-w-md space-y-8">
                            <div className="w-24 h-24 bg-amber-500/10 rounded-[2.5rem] flex items-center justify-center text-amber-500 mx-auto border border-amber-500/20">
                                <AlertTriangle size={48} />
                            </div>
                            <h3 className="text-3xl font-black text-white uppercase tracking-tight">Stage Environment</h3>
                            <p className="text-sm text-slate-400 font-bold leading-relaxed uppercase tracking-widest">
                                Google Slides previews are unavailable on <span className="text-amber-500">localhost</span>. <br/>
                                <span className="text-slate-500">Deploy to production to activate the live theater.</span>
                            </p>
                            <div className="pt-6">
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-4 bg-white text-slate-950 px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-[11px] hover:bg-indigo-500 hover:text-white transition-all shadow-2xl"
                                >
                                    Launch Presentation <ExternalLink size={16} />
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                {(!loaded && !isLocal) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-20">
                        <div className="flex flex-col items-center gap-6">
                            <div className="relative w-28 h-28">
                                <div className="absolute inset-0 border-[6px] border-white/5 rounded-full" />
                                <div className="absolute inset-0 border-[6px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <MonitorPlay size={36} className="text-indigo-500/30 animate-pulse" />
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.6em]">Projecting Mastery</p>
                        </div>
                    </div>
                )}
            </div>


            <div className={cn(
                "p-10 rounded-[4rem] border transition-all duration-1000",
                lessonComplete
                    ? "bg-emerald-50/20 border-emerald-100"
                    : "bg-white border-slate-100 shadow-2xl",
                isFocusMode && "opacity-20 blur-xl scale-95 pointer-events-none translate-y-12"
            )}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                    <div className="flex items-center gap-8">
                        <div className={cn(
                            "w-20 h-20 rounded-[2rem] flex items-center justify-center border-4 transition-all duration-1000",
                            lessonComplete
                                ? "bg-white text-emerald-500 border-emerald-100 scale-110 shadow-lg"
                                : "bg-slate-50 text-indigo-600 border-slate-100"
                        )}>
                            {lessonComplete ? <CheckCircle2 size={40} /> : <Presentation size={40} />}
                        </div>
                        <div className="text-left">
                            <h4 className={cn(
                                "text-2xl font-black uppercase tracking-tight mb-2 leading-none",
                                lessonComplete ? "text-emerald-900" : "text-slate-900"
                            )}>
                                {lessonComplete ? 'Presentation Captured' : 'Slide Deck Review'}
                            </h4>
                            <p className={cn(
                                "text-[10px] font-black uppercase tracking-[0.3em]",
                                lessonComplete ? "text-emerald-600" : "text-slate-400"
                            )}>
                                {lessonComplete ? 'Insights Secured' : 'Analyze slides to unlock next stage'}
                            </p>
                        </div>
                    </div>

                    {!lessonComplete && (
                        <button
                            onClick={onComplete}
                            className="group relative bg-slate-950 text-white px-12 h-20 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-800 transition-all active:scale-95 shadow-2xl overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-3">
                                Mark as Reviewed <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-slate-800 to-slate-900 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    )}
                </div>
            </div>

            <div className={cn("transition-all duration-1000", isFocusMode ? "opacity-0" : "opacity-100")}>
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-all bg-white px-10 py-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 w-fit"
                >
                    <ExternalLink size={16} /> Open Presentation Original
                </a>
            </div>
        </div>
    );
}
