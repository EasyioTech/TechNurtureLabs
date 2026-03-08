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
    className?: string;
}

/**
 * Premium Slideshow Viewer for PPTX and Presentations.
 */
export function PPTViewer({ url, onComplete, lessonComplete, className }: PPTViewerProps) {
    const [loaded, setLoaded] = useState(false);

    // Google Docs viewer REQUIRES an absolute, public URL.
    // Relative URLs (/api/...) will fail. Localhost URLs will also fail because Google cannot reach your computer.
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const absoluteUrl = url.startsWith('http') ? url : (typeof window !== 'undefined' ? window.location.origin + url : url);
    const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(absoluteUrl)}&embedded=true`;

    return (
        <div className={cn("space-y-10 w-full", className)}>
            <div className="group relative w-full bg-slate-900 rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl shadow-indigo-900/10 h-[75vh]">
                {!isLocal ? (
                    <iframe
                        src={viewerUrl}
                        className="w-full h-full relative z-10 border-0"
                        onLoad={() => setLoaded(true)}
                        allowFullScreen
                        title="Presentation Viewer"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-30 p-12 text-center">
                        <div className="max-w-md space-y-6">
                            <div className="w-20 h-20 bg-amber-500/10 rounded-[2rem] flex items-center justify-center text-amber-500 mx-auto border border-amber-500/20">
                                <AlertTriangle size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight">Development Notice</h3>
                            <p className="text-sm text-slate-400 font-medium leading-relaxed uppercase">
                                Google Docs Viewer cannot preview files from <span className="text-amber-500 font-black">localhost</span> because your local server is not accessible to the public internet.
                            </p>
                            <div className="pt-4">
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-3 bg-white text-slate-950 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-500 hover:text-white transition-all shadow-2xl"
                                >
                                    Open Slides Directly <ExternalLink size={14} />
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                {(!loaded && !isLocal) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-20">
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative w-24 h-24">
                                <div className="absolute inset-0 border-[6px] border-white/5 rounded-full" />
                                <div className="absolute inset-0 border-[6px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Presentation size={32} className="text-white/20 animate-pulse" />
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Preparing Slides</p>
                        </div>
                    </div>
                )}
            </div>


            <div className={cn(
                "p-8 rounded-[2.5rem] border transition-all duration-500",
                lessonComplete
                    ? "bg-emerald-50/50 border-emerald-100"
                    : "bg-white border-slate-100 shadow-xl shadow-slate-200/50"
            )}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-5">
                        <div className={cn(
                            "w-16 h-16 rounded-[1.5rem] flex items-center justify-center border-2 transition-all duration-500",
                            lessonComplete
                                ? "bg-white text-emerald-500 border-emerald-100 scale-110 shadow-sm"
                                : "bg-slate-50 text-slate-400 border-slate-100"
                        )}>
                            {lessonComplete ? <CheckCircle2 size={32} /> : <MonitorPlay size={32} />}
                        </div>
                        <div>
                            <h4 className={cn(
                                "text-lg font-black uppercase tracking-tight leading-none mb-2 transition-colors",
                                lessonComplete ? "text-emerald-900" : "text-slate-900"
                            )}>
                                {lessonComplete ? 'Slides Reviewed' : 'Review Slides'}
                            </h4>
                            <p className={cn(
                                "text-xs font-bold uppercase tracking-widest leading-none transition-colors",
                                lessonComplete ? "text-emerald-600" : "text-slate-400"
                            )}>
                                {lessonComplete ? 'You have reviewed all the slides.' : 'Go through the slides to understand the concepts.'}
                            </p>
                        </div>
                    </div>

                    {!lessonComplete && (
                        <button
                            onClick={onComplete}
                            className="group relative bg-slate-950 text-white px-10 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200 overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                Finished Review <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-4">
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-all bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1"
                >
                    <ExternalLink size={14} /> View Original Slideshow
                </a>
            </div>
        </div>
    );
}
