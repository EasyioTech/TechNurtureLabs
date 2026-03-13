'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MonitorPlay,
    ExternalLink,
    CheckCircle2,
    ChevronRight,
    Presentation,
    AlertTriangle,
    Download,
    Eye,
    Layout,
    Loader2,
    Lock,
    Maximize2,
    ArrowDownCircle,
    Zap,
    ZapOff,
    MonitorOff,
    Play
} from 'lucide-react';

interface PPTViewerProps {
    url: string;
    onComplete: () => void;
    lessonComplete: boolean;
    isFocusMode?: boolean;
    className?: string;
}

export function PPTViewer({ url, onComplete, lessonComplete, isFocusMode, className }: PPTViewerProps) {
    const [loaded, setLoaded] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [lowBandwidth, setLowBandwidth] = useState(false);
    const [manualLoad, setManualLoad] = useState(false);
    const completionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);

        // Auto-detect slow connections
        if (typeof navigator !== 'undefined' && (navigator as any).connection) {
            const conn = (navigator as any).connection;
            if (conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === '3g') {
                setLowBandwidth(true);
            }
        }
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const absoluteUrl = useMemo(() => {
        if (!url) return '';
        if (/^https?:\/\//i.test(url)) return url;
        if (typeof window !== 'undefined') {
            return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
        }
        return url;
    }, [url]);

    const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(absoluteUrl)}&embedded=true`;

    return (
        <div className={cn("w-full transition-all flex flex-col", className)}>
            
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 px-5 md:py-5 md:px-8 bg-white border-b border-slate-100 sm:rounded-2xl sm:mb-8 sticky top-0 z-[60] shadow-sm gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shadow-sm">
                        <Presentation className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div>
                        <h2 className="text-xs md:text-sm font-black uppercase tracking-wider text-slate-900 leading-none">Presentation</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 hidden md:block">Streaming Optimized</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* Bandwidth Optimization Toggle */}
                    <button 
                         onClick={() => setLowBandwidth(!lowBandwidth)}
                         className={cn(
                             "hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                             lowBandwidth ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-slate-50 text-slate-400 border border-slate-100"
                         )}
                    >
                        {lowBandwidth ? <Zap size={14} /> : <ZapOff size={14} />}
                        <span>{lowBandwidth ? 'Data Saver On' : 'Standard'}</span>
                    </button>

                    <a 
                        href={absoluteUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-slate-100 hover:bg-slate-200 rounded-xl text-[10px] md:text-[11px] font-black text-slate-700 transition-all uppercase tracking-widest active:scale-95"
                    >
                        <ExternalLink size={14} /> Full View
                    </a>
                </div>
            </div>

            {/* Viewer Area */}
            <div className={cn(
                "relative w-full overflow-hidden sm:rounded-[3rem] border border-slate-200/50 shadow-inner bg-slate-950",
                isMobile ? "aspect-[4/5]" : "aspect-video"
            )}>
                {!isLocal ? (
                    <>
                        {/* Data Saver Placeholder */}
                        {lowBandwidth && !manualLoad && (
                            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-12 text-center bg-slate-950">
                                <motion.div 
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="max-w-xs space-y-6"
                                >
                                    <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center text-amber-500 mx-auto border border-white/5 shadow-2xl">
                                        <MonitorOff size={32} />
                                    </div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Bandwidth Optimized</h3>
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                                        We've paused the presentation to save your mobile data. 
                                    </p>
                                    <button 
                                        onClick={() => setManualLoad(true)}
                                        className="w-full h-16 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl"
                                    >
                                        <Play size={16} fill="currentColor" /> Load Content
                                    </button>
                                </motion.div>
                            </div>
                        )}

                        {(!lowBandwidth || manualLoad) && (
                            <iframe
                                src={viewerUrl}
                                className={cn(
                                    "w-full h-full relative z-10 border-0 transition-opacity duration-1000 bg-white",
                                    loaded ? "opacity-100" : "opacity-0"
                                )}
                                onLoad={() => {
                                    setLoaded(true);
                                    setTimeout(() => {
                                        completionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }, 3000);
                                }}
                                allowFullScreen
                                title="Presentation"
                            />
                        )}
                    </>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-30 p-10 text-center text-white">
                        <div className="max-w-xs space-y-6">
                            <div className="w-16 h-16 bg-amber-500/10 rounded-[1.5rem] flex items-center justify-center text-amber-500 mx-auto border border-amber-500/20">
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="text-xl font-black uppercase">Local Restriction</h3>
                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                                presentations require production DNS to stream.
                            </p>
                            <a href={absoluteUrl} download className="inline-flex w-full items-center justify-center gap-3 bg-white text-slate-950 px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-[11px]">
                                <Download size={16} /> Save Offline
                            </a>
                        </div>
                    </div>
                )}

                {((!loaded && !isLocal) && (!lowBandwidth || manualLoad)) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-20">
                         <div className="flex flex-col items-center gap-6">
                            <div className="w-12 h-12 border-4 border-white/5 border-t-orange-500 rounded-full animate-spin" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hydrating Session...</p>
                         </div>
                    </div>
                )}
            </div>

            {/* Completion Banner */}
            <div ref={completionRef} className="w-full px-4 mb-20 mt-12">
                <AnimatePresence>
                    {(loaded || lessonComplete) && (
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                "p-8 md:p-12 lg:p-16 rounded-[2.5rem] md:rounded-[4rem] border flex flex-col lg:flex-row items-center justify-between gap-10 shadow-2xl",
                                lessonComplete ? "bg-emerald-50 border-emerald-100 shadow-none" : "bg-white border-slate-200 ring-1 ring-slate-100"
                            )}
                        >
                            <div className="flex items-center gap-6 md:gap-10">
                                <div className={cn(
                                    "w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-[2.5rem] flex items-center justify-center border-4 transition-all duration-1000",
                                    lessonComplete ? "bg-emerald-500 text-white border-emerald-100 shadow-md" : "bg-slate-50 text-indigo-600 border-white shadow-inner"
                                )}>
                                    {lessonComplete ? <CheckCircle2 className="w-8 h-8 md:w-12 md:h-12" /> : <Eye className="w-8 h-8 md:w-12 md:h-12" />}
                                </div>
                                <div className="text-left">
                                    <h4 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-slate-900 leading-none">
                                        {lessonComplete ? 'Presentation Finished' : 'Confirm Analysis'}
                                    </h4>
                                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                                        {lessonComplete ? 'Session sync successful.' : 'Mark as analyzed to update your streak.'}
                                    </p>
                                </div>
                            </div>

                            {!lessonComplete && (
                                <button
                                    onClick={onComplete}
                                    className="w-full lg:w-auto bg-slate-950 text-white px-12 md:px-16 h-20 md:h-24 rounded-2xl md:rounded-[2.5rem] font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3"
                                >
                                    Mark Finished <ArrowDownCircle className="animate-bounce" size={20} />
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
