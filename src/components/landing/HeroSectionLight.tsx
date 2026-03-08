'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, PlayCircle, Sparkles, ChevronRight } from 'lucide-react';

export const HeroSectionLight = ({ settings }: { settings?: any }) => {
    return (
        <section className="relative pt-36 pb-20 lg:pt-48 overflow-hidden bg-[#FAFAFA] min-h-[100svh] flex flex-col justify-start items-center">

            {/* Extremely Subtle Ambient Background */}
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-100/40 rounded-[100%] blur-[120px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 flex flex-col items-center text-center">

                {/* Top Announcement Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-white border border-slate-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-8"
                >
                    <div className="flex items-center gap-2">
                        {settings?.logo_url ? (
                            <img src={settings.logo_url} alt="Logo" className="w-3.5 h-3.5 object-contain grayscale opacity-80" />
                        ) : (
                            <Sparkles size={12} className="text-slate-400" />
                        )}
                        {settings?.show_platform_name !== false && (
                            <span className="text-[11px] font-semibold text-slate-600 tracking-wider uppercase">
                                {settings?.platform_name || 'TechNurture'} OS is live
                            </span>
                        )}
                    </div>
                    <div className="w-px h-3 bg-slate-200" />
                    <span className="text-[11px] font-medium text-blue-600 flex items-center gap-0.5 cursor-pointer hover:underline pr-1">
                        Read announcement <ChevronRight size={10} />
                    </span>
                </motion.div>

                {/* Main Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="text-6xl sm:text-7xl md:text-[88px] font-bold tracking-[-0.03em] leading-[1.05] text-slate-900 max-w-5xl mb-8"
                >
                    The operating system for <br className="hidden md:block" />
                    <span className="font-[family-name:var(--font-playfair)] italic font-medium text-slate-500 pr-2">modern</span>
                    learning.
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="text-lg md:text-xl text-slate-500 max-w-2xl font-medium leading-relaxed mb-10"
                >
                    A unified, deeply psychological infrastructure for K-12. Elevate student outcomes with breathtaking design and frictionless administration.
                </motion.p>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
                >
                    <Link href="/register/student" className="w-full sm:w-auto">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0F172A] text-white font-medium px-8 py-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all text-sm tracking-wide"
                        >
                            Start building for free
                            <ArrowRight size={16} />
                        </motion.button>
                    </Link>
                    <Link href="#demo" className="w-full sm:w-auto">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-slate-700 font-medium px-8 py-4 rounded-xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all text-sm tracking-wide"
                        >
                            <PlayCircle size={18} className="text-slate-400" />
                            Watch Demo
                        </motion.button>
                    </Link>
                </motion.div>

                {/* Visual / Interface Mockup Area */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-5xl mt-24 relative"
                >
                    {/* Floating Interface Illusion */}
                    <div className="relative w-full aspect-[16/9] rounded-[2rem] bg-white border border-slate-200/50 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] overflow-hidden">

                        {/* Top Bar Fake UI */}
                        <div className="h-14 border-b border-slate-100 flex items-center px-6 gap-4 bg-slate-50/50">
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                                <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                                <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                            </div>
                            <div className="ml-4 h-6 w-48 bg-white rounded-md border border-slate-200 shadow-sm" />
                        </div>

                        {/* Inner layout illusion */}
                        <div className="flex h-[calc(100%-3.5rem)]">
                            <div className="hidden sm:flex w-64 border-r border-slate-100 bg-slate-50/30 p-6 flex-col gap-4">
                                <div className="h-4 w-24 bg-slate-200 rounded-sm mb-4" />
                                <div className="h-8 w-full bg-slate-100 rounded-md" />
                                <div className="h-8 w-full bg-slate-100 rounded-md" />
                                <div className="h-8 w-3/4 bg-slate-100 rounded-md" />
                            </div>
                            <div className="flex-1 p-6 sm:p-10 flex flex-col gap-6 sm:gap-8 bg-white relative">
                                {/* Gradient fade out at bottom of the preview */}
                                <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-white to-transparent" />

                                <div className="h-8 w-48 sm:w-64 bg-slate-100 rounded-lg" />
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <div className="h-24 sm:h-32 bg-slate-50 border border-slate-100 rounded-xl" />
                                    <div className="hidden sm:block h-32 bg-slate-50 border border-slate-100 rounded-xl" />
                                    <div className="hidden sm:block h-32 bg-slate-50 border border-slate-100 rounded-xl" />
                                </div>
                                <div className="h-40 sm:h-64 w-full bg-slate-50 border border-slate-100 rounded-xl" />
                            </div>
                        </div>

                    </div>
                </motion.div>

            </div>

            {/* Bottom Gradient Fade Into Next Section */}
            <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-white to-transparent pointer-events-none z-20" />
        </section>
    );
};
