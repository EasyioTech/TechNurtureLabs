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
    className?: string;
}

/**
 * Premium Document Viewer for PDF and text-based documents.
 */
export function PDFViewer({ url, onComplete, lessonComplete, className }: PDFViewerProps) {
    const [loaded, setLoaded] = useState(false);

    // Google Docs viewer as a fallback, but prioritize native iframe for direct PDFs
    const isDirectPdf = url.toLowerCase().split('?')[0].endsWith('.pdf');
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    // For Google Docs Viewer, we need an absolute URL
    const absoluteUrl = url.startsWith('http') ? url : (typeof window !== 'undefined' ? window.location.origin + url : url);
    const viewerUrl = isDirectPdf
        ? url
        : `https://docs.google.com/viewer?url=${encodeURIComponent(absoluteUrl)}&embedded=true`;

    const showLocalWarning = !isDirectPdf && isLocal;

    return (
        <div className={cn("space-y-10 w-full", className)}>
            <div className="group relative w-full bg-slate-900 rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl shadow-indigo-900/10 h-[80vh]">
                {!showLocalWarning ? (
                    <iframe
                        src={viewerUrl}
                        className="w-full h-full relative z-10 border-0"
                        onLoad={() => setLoaded(true)}
                        title="Document Viewer"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-30 p-12 text-center">
                        <div className="max-w-md space-y-6">
                            <div className="w-20 h-20 bg-amber-500/10 rounded-[2rem] flex items-center justify-center text-amber-500 mx-auto border border-amber-500/20">
                                <AlertTriangle size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight">Preview Unavailable</h3>
                            <p className="text-sm text-slate-400 font-medium leading-relaxed uppercase">
                                DOCX/Text file previews from <span className="text-amber-500 font-black">localhost</span> are not supported by the Google Viewer.
                            </p>
                            <div className="pt-4">
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-3 bg-white text-slate-950 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-500 hover:text-white transition-all shadow-2xl"
                                >
                                    Open/Download Document <ExternalLink size={14} />
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                {!loaded && !showLocalWarning && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-20">
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative w-20 h-20">
                                <div className="absolute inset-0 border-4 border-white/10 rounded-full" />
                                <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] animate-pulse">Loading Document</p>
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
                            {lessonComplete ? <CheckCircle2 size={32} /> : <FileText size={32} />}
                        </div>
                        <div>
                            <h4 className={cn(
                                "text-lg font-black uppercase tracking-tight leading-none mb-2 transition-colors",
                                lessonComplete ? "text-emerald-900" : "text-slate-900"
                            )}>
                                {lessonComplete ? 'Finished Reading' : 'Reading Material'}
                            </h4>
                            <p className={cn(
                                "text-xs font-bold uppercase tracking-widest leading-none transition-colors",
                                lessonComplete ? "text-emerald-600" : "text-slate-400"
                            )}>
                                {lessonComplete ? 'Reading material completed.' : 'Read through the document to continue your progress.'}
                            </p>
                        </div>
                    </div>

                    {!lessonComplete && (
                        <button
                            onClick={onComplete}
                            className="group relative bg-slate-950 text-white px-10 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-indigo-200 overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                Mark Reading Successful <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                    <ExternalLink size={14} /> Open Document in New Tab
                </a>
            </div>
        </div>
    );
}
