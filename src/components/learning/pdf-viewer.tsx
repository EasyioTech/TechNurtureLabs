'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
    FileText,
    ExternalLink,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Maximize2,
    Download,
    Eye,
    AlertTriangle
} from 'lucide-react';

interface PDFViewerProps {
    url: string;
    onComplete: () => void;
    lessonComplete: boolean;
    isFocusMode?: boolean;
    className?: string;
}

/**
 * Premium Document Viewer for PDF and text-based documents.
 * Redesigned for Cinematic Zen focus.
 */
export function PDFViewer({ url, onComplete, lessonComplete, isFocusMode, className }: PDFViewerProps) {
    const [loaded, setLoaded] = useState(false);

    const isDirectPdf = url.toLowerCase().split('?')[0].endsWith('.pdf');
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const absoluteUrl = url.startsWith('http') ? url : (typeof window !== 'undefined' ? window.location.origin + url : url);
    const viewerUrl = isDirectPdf
        ? url
        : `https://docs.google.com/viewer?url=${encodeURIComponent(absoluteUrl)}&embedded=true`;

    const showLocalWarning = !isDirectPdf && isLocal;

    return (
        <div className={cn("space-y-12 w-full transition-all duration-1000", className)}>
            <div className={cn(
                "relative w-full bg-slate-900 rounded-[3.5rem] overflow-hidden border transition-all duration-1000 h-[85vh]",
                isFocusMode ? "border-white/10 shadow-[0_0_100px_-20px_rgba(79,70,229,0.3)] scale-[1.02]" : "border-slate-200/50 shadow-2xl shadow-indigo-900/10"
            )}>
                {!showLocalWarning ? (
                    <iframe
                        src={viewerUrl}
                        className={cn(
                            "w-full h-full relative z-10 border-0 transition-opacity duration-1000",
                            loaded ? "opacity-100" : "opacity-0"
                        )}
                        onLoad={() => setLoaded(true)}
                        title="Document Viewer"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-30 p-12 text-center">
                        <div className="max-w-md space-y-8">
                            <div className="w-24 h-24 bg-amber-500/10 rounded-[2.5rem] flex items-center justify-center text-amber-500 mx-auto border border-amber-500/20">
                                <AlertTriangle size={48} />
                            </div>
                            <h3 className="text-3xl font-black text-white uppercase tracking-tight">Preview Unavailable</h3>
                            <p className="text-sm text-slate-400 font-bold leading-relaxed uppercase tracking-widest">
                                Localhost previews are restricted. <br/>
                                <span className="text-amber-500">Please deploy to production for full integration.</span>
                            </p>
                            <div className="pt-6">
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-4 bg-white text-slate-950 px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-[11px] hover:bg-indigo-500 hover:text-white transition-all shadow-2xl"
                                >
                                    Open Document <ExternalLink size={16} />
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                {(!loaded && !showLocalWarning) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-20">
                        <div className="flex flex-col items-center gap-6">
                            <div className="relative w-24 h-24">
                                <div className="absolute inset-0 border-4 border-white/5 rounded-full" />
                                <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <FileText size={32} className="text-indigo-500/50" />
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em] animate-pulse">Syncing Knowledge</p>
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
                            {lessonComplete ? <CheckCircle2 size={40} /> : <Eye size={40} />}
                        </div>
                        <div className="text-left">
                            <h4 className={cn(
                                "text-2xl font-black uppercase tracking-tight mb-2 leading-none",
                                lessonComplete ? "text-emerald-900" : "text-slate-900"
                            )}>
                                {lessonComplete ? 'Module Completed' : 'Deep Reading'}
                            </h4>
                            <p className={cn(
                                "text-[10px] font-black uppercase tracking-[0.3em]",
                                lessonComplete ? "text-emerald-600" : "text-slate-400"
                            )}>
                                {lessonComplete ? 'Content Synchronized' : 'Analyze documents for progress'}
                            </p>
                        </div>
                    </div>

                    {!lessonComplete && (
                        <button
                            onClick={onComplete}
                            className="group relative bg-slate-950 text-white px-12 h-20 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-indigo-600 transition-all active:scale-95 shadow-2xl overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-3">
                                Complete Reading <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    )}
                </div>
            </div>

            <div className={cn("transition-all duration-1000", isFocusMode ? "opacity-0" : "opacity-100")}>
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-all bg-white px-8 py-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-2xl"
                >
                    <Download size={14} /> Download Reference Material
                </a>
            </div>
        </div>
    );
}
