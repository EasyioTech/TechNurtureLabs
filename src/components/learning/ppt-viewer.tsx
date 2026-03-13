'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Presentation,
    ExternalLink,
    CheckCircle2,
    Eye,
    AlertTriangle,
    Download,
    Loader2,
    MonitorOff,
    Play,
    ArrowDownCircle,
    Zap,
    ZapOff,
    Smartphone,
    LayoutGrid,
    X,
    ChevronLeft,
    ChevronRight,
    FileText,
    Layers
} from 'lucide-react';

interface PPTViewerProps {
    url: string;
    onComplete: () => void;
    lessonComplete: boolean;
    isFocusMode?: boolean;
    className?: string;
}

/**
 * Premium PPTX Viewer - Light Mode Edition
 * - Seamless Integrated Layout (Non-windowed)
 * - Sidebar Slide Navigator
 * - High-Fidelity Light Theme
 */
export function PPTViewer({ url, onComplete, lessonComplete, isFocusMode, className }: PPTViewerProps) {
    const [loaded, setLoaded] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [lowBandwidth, setLowBandwidth] = useState(false);
    const [manualLoad, setManualLoad] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);
    const completionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            const mobile = width < 768;
            const tablet = width >= 768 && width < 1024;
            
            setIsMobile(mobile);
            setIsTablet(tablet);
            
            // Auto-hide sidebar on mobile or tablet to maximize slide space
            if (mobile || tablet) {
                setShowSidebar(false);
            } else {
                setShowSidebar(true);
            }
        };
        
        handleResize();
        window.addEventListener('resize', handleResize);

        const timer = setTimeout(() => setLoaded(true), 1500);

        if (typeof navigator !== 'undefined' && (navigator as any).connection) {
            const conn = (navigator as any).connection;
            if (conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === '3g') {
                setLowBandwidth(true);
            }
        }
        
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timer);
        };
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
        <div className={cn("w-full relative flex flex-col bg-slate-50 min-h-screen", className)}>
            
            {/* Header / Toolbar - Highly Responsive */}
            <div className="sticky top-0 z-[60] px-3 md:px-8 py-3 md:py-5 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 md:gap-8">
                        <button 
                            onClick={() => setShowSidebar(!showSidebar)}
                            className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-200 shrink-0"
                            title="Toggle Navigator"
                        >
                            <LayoutGrid size={18} className="md:size-5" />
                        </button>

                        <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 shrink-0">
                                <Presentation size={16} className="md:size-5" />
                            </div>
                            <div className="hidden sm:block overflow-hidden">
                                <h2 className="text-[10px] md:text-xs font-black uppercase tracking-wider text-slate-900 leading-none truncate font-outfit">Curriculum</h2>
                                <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5 md:mt-1 truncate">Presentation Stream</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 md:gap-3">
                         <div className={cn(
                             "hidden xs:flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest border transition-all",
                             lowBandwidth ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-slate-50 text-slate-400 border-slate-100"
                         )}>
                            {lowBandwidth ? <Zap size={10} className="md:size-3" fill="currentColor" /> : <ZapOff size={10} className="md:size-3" />}
                            <span className="hidden md:inline">{lowBandwidth ? 'Eco Mode' : 'High Resolution'}</span>
                        </div>

                        <div className="h-6 md:h-8 w-px bg-slate-200 mx-0.5 md:mx-1 hidden sm:block" />

                        <a 
                            href={absoluteUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-9 h-9 md:w-11 md:h-11 flex items-center justify-center bg-white border border-slate-200 rounded-lg md:rounded-xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm shrink-0"
                        >
                            <ExternalLink size={16} className="md:size-[18px]" />
                        </a>
                        <a 
                            href={absoluteUrl} 
                            download 
                            className="px-3 md:px-5 h-9 md:h-11 flex items-center gap-2 bg-indigo-600 text-white rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-slate-900 transition-all shrink-0"
                        >
                            <Download size={14} className="md:size-4" /> <span className="hidden xs:inline">Download</span>
                        </a>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row relative w-full overflow-hidden">
                
                {/* Sidebar Slide Navigator - Responsive Drawer/Overlay */}
                <AnimatePresence>
                    {showSidebar && (
                        <motion.aside 
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className={cn(
                                "z-[70] bg-white border-r border-slate-200 overflow-y-auto custom-scrollbar shadow-2xl lg:shadow-none",
                                (isMobile || isTablet) ? "fixed inset-0 top-0 bottom-0 w-[280px] md:w-[320px]" : "sticky top-[76px] h-[calc(100vh-76px)] w-[260px]"
                            )}
                        >
                            <div className="p-4 md:p-6 space-y-6">
                                <div className="flex items-center justify-between mb-4 sticky top-0 bg-white py-2 z-10 border-b border-slate-100">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 font-outfit">Resource Navigator</h3>
                                    <button 
                                        onClick={() => setShowSidebar(false)}
                                        className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        <X size={20} className="text-slate-400" />
                                    </button>
                                </div>

                                <div className="space-y-4 pb-20 lg:pb-0">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div 
                                            key={i}
                                            className={cn(
                                                "group relative cursor-pointer rounded-2xl border-2 p-2 transition-all hover:border-indigo-200 hover:shadow-md",
                                                i === 1 ? "border-indigo-600 bg-indigo-50/30 shadow-sm" : "border-slate-100"
                                            )}
                                        >
                                            <div className="aspect-video bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden border border-slate-100 group-hover:bg-white transition-colors">
                                                <Layers size={24} className={cn("text-slate-300 transition-all", i === 1 ? "text-indigo-400 scale-110" : "group-hover:text-indigo-300")} />
                                            </div>
                                            <div className="mt-3 flex items-center justify-between px-1">
                                                <span className={cn("text-[8px] md:text-[9px] font-black uppercase tracking-widest font-outfit", i === 1 ? "text-indigo-600" : "text-slate-400")}>Slide {i}</span>
                                                {i === 1 && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />}
                                            </div>
                                        </div>
                                    ))}
                                    <div className="py-6 text-center border-2 border-dashed border-slate-100 rounded-[1.5rem] md:rounded-[2rem]">
                                        <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest font-outfit">Loading curriculum...</p>
                                    </div>
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* Mobile Backdrop Overlay */}
                <AnimatePresence>
                    {showSidebar && (isMobile || isTablet) && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowSidebar(false)}
                            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[65]"
                        />
                    )}
                </AnimatePresence>

                {/* Main Content Area - Optimized for Screen Real Estate */}
                <main className="flex-1 flex flex-col p-2 md:p-6 lg:p-8 relative min-h-[70vh] md:min-h-[85vh] overflow-hidden">
                    <div className={cn(
                        "w-full h-full flex flex-col bg-white rounded-2xl md:rounded-[2.5rem] lg:rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden transition-all duration-700",
                        !loaded && "animate-pulse"
                    )}>
                        {!isLocal ? (
                            <div className={cn(
                                "flex-1 w-full bg-white transition-opacity duration-1000 overflow-hidden",
                                loaded ? "opacity-100" : "opacity-0"
                            )}>
                                <DocViewer 
                                    documents={docs} 
                                    pluginRenderers={DocViewerRenderers}
                                    style={{ height: '100%', width: '100%' }}
                                    config={{
                                        header: {
                                            disableHeader: true,
                                        },
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 text-center h-[50vh] md:h-auto">
                                <div className="w-16 h-16 md:w-24 md:h-24 bg-amber-50 rounded-2xl md:rounded-[3rem] flex items-center justify-center text-amber-500 mb-6 md:mb-8 border border-amber-100 shrink-0">
                                    <AlertTriangle size={30} className="md:size-10" />
                                </div>
                                <h3 className="text-lg md:text-2xl font-black text-slate-900 uppercase tracking-tight mb-2 md:mb-4 font-outfit">Security Restriction</h3>
                                <p className="text-[9px] md:text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-relaxed max-w-xs md:max-w-sm">
                                    Authorised presentation streams require a production environment. 
                                </p>
                                <a href={absoluteUrl} download className="mt-6 md:mt-10 inline-flex items-center gap-3 bg-slate-900 text-white px-8 md:px-10 h-14 md:h-16 rounded-xl md:rounded-[1.5rem] font-black uppercase tracking-widest text-[9px] md:text-[11px] hover:bg-indigo-600 transition-all shadow-xl">
                                    <Download size={16} className="md:size-4" /> Offline Mode
                                </a>
                            </div>
                        )}

                        {/* Integrated Loading Overlay */}
                        {!loaded && !isLocal && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/60 backdrop-blur-md">
                                <div className="relative mb-6 md:mb-8">
                                    <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
                                    <div className="absolute inset-0 border-4 border-indigo-600/10 rounded-full blur-[2px]" />
                                </div>
                                <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] animate-pulse font-outfit text-center px-4">Establishing Secure Stream...</p>
                            </div>
                        )}
                    </div>

                    {/* Completion Section - Stacked for Mobile */}
                    <div ref={completionRef} className="mt-8 md:mt-20 px-1 md:px-0">
                        <AnimatePresence>
                            {(loaded || lessonComplete) && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "p-6 md:p-12 lg:p-14 rounded-2xl md:rounded-[3rem] lg:rounded-[4rem] flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-12 transition-all",
                                        lessonComplete ? "bg-emerald-500 text-white shadow-3xl shadow-emerald-200" : "bg-white border border-slate-200 shadow-xl"
                                    )}
                                >
                                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-center md:text-left">
                                        <div className={cn(
                                            "w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-2xl md:rounded-[2.5rem] flex items-center justify-center border-4 transition-all duration-1000 shrink-0",
                                            lessonComplete ? "bg-white text-emerald-600 border-white/20" : "bg-indigo-50 text-indigo-600 border-indigo-100"
                                        )}>
                                            {lessonComplete ? <CheckCircle2 size={30} className="md:size-10" /> : <Eye size={30} className="md:size-10" />}
                                        </div>
                                        <div>
                                            <h4 className="text-xl md:text-3xl font-black uppercase tracking-tighter leading-none mb-2 md:mb-3 font-outfit">
                                                {lessonComplete ? 'Mastery Recorded' : 'Material Reviewed'}
                                            </h4>
                                            <p className={cn(
                                                "text-[8px] md:text-[10px] font-bold uppercase tracking-widest font-outfit",
                                                lessonComplete ? "text-white/60" : "text-slate-400"
                                            )}>
                                                {lessonComplete ? 'Your account has been updated.' : 'Complete the lesson to claim your rewards.'}
                                            </p>
                                        </div>
                                    </div>

                                    {!lessonComplete && (
                                        <button
                                            onClick={onComplete}
                                            className="w-full lg:w-auto h-16 md:h-24 px-8 md:px-20 bg-slate-900 text-white rounded-xl md:rounded-[2rem] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] text-[9px] md:text-[11px] hover:bg-indigo-600 transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3 md:gap-4 shrink-0 font-outfit"
                                        >
                                            Complete Lesson <ArrowDownCircle size={18} className="md:size-5" />
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                #react-doc-viewer #proxy-renderer { background: white !important; }
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
                .font-outfit { font-family: 'Outfit', sans-serif; }
            `}</style>
        </div>
    );
}
