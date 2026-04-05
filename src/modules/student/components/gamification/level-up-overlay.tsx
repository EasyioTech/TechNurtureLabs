'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, Star, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LevelUpOverlayProps {
    newLevel: number;
    show: boolean;
    onClose: () => void;
}

export function LevelUpOverlay({ newLevel, show, onClose }: LevelUpOverlayProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (show) {
            setMounted(true);
            // Professional "Celebration" Confetti - Golden & Emerald theme
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 300 };

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: any = setInterval(function() {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                    colors: ['#FFD700', '#B8860B', '#F0E68C', '#059669']
                });
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                    colors: ['#FFD700', '#B8860B', '#F0E68C', '#059669']
                });
            }, 250);

            return () => clearInterval(interval);
        } else {
            setMounted(false);
        }
    }, [show]);

    if (!show) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl px-6"
            >
                {/* Philosophical Growth Rings */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.1 }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-emerald-500/20 rounded-full" 
                    />
                    <motion.div 
                        initial={{ scale: 0.3, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.05 }}
                        transition={{ duration: 2, delay: 0.5, repeat: Infinity, repeatType: 'reverse' }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] border border-amber-500/10 rounded-full" 
                    />
                </div>

                <motion.div
                    initial={{ scale: 0.8, y: 40, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 20, opacity: 0 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                    className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 to-slate-950 rounded-[2.5rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden"
                >
                    {/* Decorative Header */}
                    <div className="h-2 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500" />
                    
                    <div className="p-10 text-center space-y-8">
                        {/* Rank Badge */}
                        <div className="relative flex justify-center">
                            <motion.div
                                initial={{ rotate: -15, scale: 0.5 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring' }}
                                className="w-28 h-28 bg-gradient-to-br from-amber-300 to-amber-600 rounded-[2rem] flex items-center justify-center shadow-[0_20px_50px_rgba(217,119,6,0.3)]"
                            >
                                <Trophy className="text-white" size={48} strokeWidth={2.5} />
                                
                                {/* Orbiting Stars */}
                                <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                                    className="absolute inset-0 -m-4"
                                >
                                    <Star className="absolute top-0 left-1/2 -translate-x-1/2 text-amber-200 fill-amber-200" size={14} />
                                </motion.div>
                            </motion.div>
                        </div>

                        <div className="space-y-3">
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em]"
                            >
                                Milestone Reached
                            </motion.p>
                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="text-5xl font-black text-white italic tracking-tighter"
                            >
                                LEVEL {newLevel}
                            </motion.h2>
                        </div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="text-slate-400 text-sm font-medium leading-relaxed max-w-[280px] mx-auto"
                        >
                            Your dedication to excellence has unlocked a new tier of mastery. Keep pushing boundaries.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.9 }}
                            className="pt-4"
                        >
                            <button
                                onClick={onClose}
                                className="group relative w-full h-16 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] overflow-hidden transition-all hover:scale-[1.02] active:scale-95"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="relative flex items-center justify-center gap-2">
                                    Continue Journey <ChevronRight size={18} strokeWidth={3} />
                                </span>
                            </button>
                        </motion.div>
                    </div>

                    {/* Footer Details */}
                    <div className="px-10 py-6 bg-white/5 border-t border-white/5 flex items-center justify-center gap-6">
                        <div className="flex items-center gap-2">
                            <Sparkles size={14} className="text-amber-400" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">New Perks Unlocked</span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
