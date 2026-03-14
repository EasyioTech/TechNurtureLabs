'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Presentation,
    CheckCircle2,
    Eye,
    AlertTriangle,
    Download,
    Loader2,
    ArrowDownCircle
} from 'lucide-react';

interface PPTViewerProps {
    url: string;
    onComplete: () => void;
    lessonComplete: boolean;
    className?: string;
}

export function PPTViewer({ url, onComplete, lessonComplete, className }: PPTViewerProps) {
    const [loaded, setLoaded] = useState(false);
    const completionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => setLoaded(true), 1500);
        return () => clearTimeout(timer);
    }, []);

    const absoluteUrl = useMemo(() => {
        if (!url) return '';
        if (/^https?:\/\//i.test(url)) return url;
        if (typeof window !== 'undefined') {
            return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
        }
        return url;
    }, [url]);

    const docs = useMemo(() => [
        { uri: absoluteUrl, fileType: "pptx" }
    ], [absoluteUrl]);

    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    return (
        <div className={cn("w-full h-full flex flex-col bg-white", className)}>
            <div className="w-full flex-1">
                <div className={cn(
                    "w-full aspect-video overflow-hidden relative transition-all duration-700",
                    !loaded && "animate-pulse"
                )}>
                    {!isLocal ? (
                        <div className={cn(
                            "w-full h-full transition-opacity duration-1000",
                            loaded ? "opacity-100" : "opacity-0"
                        )}>
                            <DocViewer 
                                documents={docs} 
                                pluginRenderers={DocViewerRenderers}
                                style={{ height: '100%', width: '100%' }}
                                config={{
                                    header: { disableHeader: true },
                                }}
                            />
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center py-20 text-center">
                            <AlertTriangle size={48} className="text-amber-500 mb-6" />
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2 font-outfit">Local Security Exception</h3>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest max-w-sm mx-auto leading-relaxed font-outfit">
                                Presentation streams require production-grade security headers. Please download the module for local analysis.
                            </p>
                            <a href={absoluteUrl} download className="mt-8 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-indigo-600 transition-all shadow-xl font-outfit">
                                <Download size={14} className="mr-2 inline" /> Download Stream
                            </a>
                        </div>
                    )}

                    {!loaded && !isLocal && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-md">
                            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin opacity-20 mb-4" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] animate-pulse font-outfit">Establishing Stream</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Completion Roadmap */}
            <div ref={completionRef} className="max-w-5xl mx-auto mt-20 mb-20 px-6">
                <AnimatePresence>
                    {(loaded || lessonComplete) && (
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                "p-10 md:p-16 rounded-[3rem] md:rounded-[4rem] flex flex-col lg:flex-row items-center justify-between gap-10 transition-all",
                                lessonComplete ? "bg-emerald-500 text-white shadow-3xl shadow-emerald-200" : "bg-white border-2 border-slate-100 shadow-2xl"
                            )}
                        >
                            <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                                <div className={cn(
                                    "w-20 h-20 rounded-[2rem] flex items-center justify-center border-4 transition-all duration-1000",
                                    lessonComplete ? "bg-white text-emerald-600 border-white/20" : "bg-indigo-50 text-indigo-600 border-indigo-100"
                                )}>
                                    {lessonComplete ? <CheckCircle2 size={32} /> : <Eye size={32} />}
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-3xl font-black uppercase tracking-tighter leading-none font-outfit">
                                        {lessonComplete ? 'Presentation Mastered' : 'Content Analyzed'}
                                    </h4>
                                    <p className={cn(
                                        "text-[10px] font-bold uppercase tracking-widest font-outfit",
                                        lessonComplete ? "text-white/60" : "text-slate-400"
                                    )}>
                                        {lessonComplete ? 'Strategic insights synchronized with your profile.' : 'Complete the analysis to unlock rewards.'}
                                    </p>
                                </div>
                            </div>

                            {!lessonComplete && (
                                <button
                                    onClick={onComplete}
                                    className="w-full lg:w-auto h-20 px-12 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[11px] hover:bg-indigo-600 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-4 font-outfit"
                                >
                                    Complete Lesson <ArrowDownCircle size={20} />
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <style jsx global>{`
                #react-doc-viewer #proxy-renderer { background: transparent !important; }
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
                .font-outfit { font-family: 'Outfit', sans-serif; }
            `}</style>
        </div>
    );
}
