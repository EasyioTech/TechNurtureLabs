'use client';

import React from 'react';
import {
    Dialog, DialogContent, DialogTitle
} from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { useAdminTheme } from '../theme-context';
import { Lesson } from '../types';
import { LessonPreviewContent } from './lesson-preview/lesson-preview-content';
import { motion, AnimatePresence } from 'framer-motion';

interface LessonPreviewModalProps {
    lesson: Lesson | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function LessonPreviewModal({ lesson, open, onOpenChange }: LessonPreviewModalProps) {
    const { isDark, accent } = useAdminTheme();

    if (!lesson) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent 
                className={`w-screen h-screen sm:w-full sm:h-[90vh] sm:max-w-6xl p-0 border-0 overflow-hidden rounded-none sm:rounded-[40px] ${isDark ? 'bg-[#0a0d13]' : 'bg-slate-50'} shadow-2xl`}
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogTitle className="sr-only">
                    {lesson.title} Preview
                </DialogTitle>

                {/* Custom Modal Header */}
                <div className={`absolute top-4 right-4 md:top-8 md:right-8 z-[210]`}>
                    <button
                        onClick={() => onOpenChange(false)}
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-900/10 hover:bg-slate-900/20 text-slate-900'} backdrop-blur-xl shadow-lg active:scale-90`}
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Top Status Bar (Floating) */}
                <div className="absolute top-4 left-6 md:top-8 md:left-10 z-[210] hidden sm:flex items-center gap-3">
                    <div className={`px-4 py-2 rounded-2xl backdrop-blur-xl border flex items-center gap-2.5 ${isDark ? 'bg-black/40 border-white/10' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
                        <div className={`w-2 h-2 rounded-full ${accent.bg} ${isDark ? 'animate-pulse' : ''}`} />
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Live Preview Mode — {lesson.content_type}
                        </span>
                    </div>
                </div>

                {/* Content Container */}
                <div className="w-full h-full overflow-y-auto custom-scrollbar bg-transparent pt-16 sm:pt-24">
                   <AnimatePresence mode="wait">
                        <motion.div
                            key={lesson.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <LessonPreviewContent lesson={lesson} />
                        </motion.div>
                   </AnimatePresence>
                </div>

                {/* Background Glows (Aesthetic) */}
                {isDark && (
                    <>
                        <div className={`absolute -top-24 -left-24 w-96 h-96 ${accent.name === 'emerald' ? 'bg-emerald-500/10' : `bg-${accent.name}-500/10`} rounded-full blur-[120px] pointer-events-none`} />
                        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
                    </>
                )}

                <style jsx global>{`
                    .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { 
                        background: ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}; 
                        border-radius: 10px; 
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { 
                        background: ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'}; 
                    }
                `}</style>
            </DialogContent>
        </Dialog>
    );
}

