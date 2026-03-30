'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Play, CheckCircle2, Sparkles } from 'lucide-react';

export const HeroSection = ({ settings }: { settings?: any }) => {
    return (
        <section className="relative z-10 pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-50">

            {/* Precision Grid Background */}
            <div
                className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />

            {/* Ambient glow - CSS Optimized for Mobile CPU */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-blue-100/60 rounded-full blur-[130px] pointer-events-none -z-10 animate-pulse-subtle" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Left Column: Copy & CTAs */}
                    <div className="flex flex-col items-start text-left max-w-2xl mx-auto lg:mx-0">

                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-slate-200 shadow-sm mb-6">
                                {settings?.logo_url ? (
                                    <img src={settings.logo_url} alt="Logo" className="w-4 h-4 object-contain" />
                                ) : (
                                    <Sparkles size={13} className="text-blue-600" />
                                )}
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">{settings?.platform_name || 'TechNurture'} Labs</span>
                            </div>
                        </div>

                        <div>
                            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6 text-slate-900">
                                The learning platform your students will{' '}
                                <span className="text-blue-600">actually love.</span>
                            </h1>
                        </div>

                        <div>
                            <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed font-medium max-w-xl">
                                Gamified courses, real-time analytics, and school-wide management — all in one unified platform built for K-12 institutions.
                            </p>
                        </div>

                        <div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                                <Link href="/register/school">
                                    <button
                                        className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-7 py-3.5 rounded-xl shadow-lg shadow-slate-900/20 transition-colors text-base cursor-pointer whitespace-nowrap"
                                    >
                                        Register Your School
                                        <ArrowRight size={17} />
                                    </button>
                                </Link>
                                <Link href="#demo">
                                    <button
                                        className="flex items-center justify-center gap-2 bg-white text-slate-700 font-semibold px-7 py-3.5 rounded-xl shadow-sm border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-base cursor-pointer whitespace-nowrap"
                                    >
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 shrink-0">
                                            <Play size={10} className="text-white ml-0.5 fill-current" />
                                        </span>
                                        Watch Demo
                                    </button>
                                </Link>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-8 text-sm text-slate-500 font-medium">
                                <div className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-500" /> No credit card required</div>
                                <div className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-500" /> 14-day free trial</div>
                                <div className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-500" /> UDISE verified</div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Hero Illustration */}
                    <div className="relative w-full max-w-[650px] mx-auto lg:ml-auto">
                        <motion.div
                            initial={{ opacity: 0, x: 16, y: 8 }}
                            animate={{ opacity: 1, x: 0, y: 0 }}
                            transition={{ duration: 0.9, ease: [0.21, 0.47, 0.32, 0.98] }}
                            className="relative z-10 w-full h-full group"
                        >
                            <img
                                src="/assets/gaming-hero.svg"
                                alt="TechNurture Education Platform"
                                loading="eager"
                                fetchPriority="high"
                                decoding="async"
                                className="w-full h-auto object-contain pointer-events-none mix-blend-multiply opacity-90 transition-transform duration-700 group-hover:scale-[1.02]"
                            />
                        </motion.div>

                        {/* Ambient glow behind illustration */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-100/30 rounded-full blur-[100px] -z-10" />
                    </div>

                </div>
            </div>
        </section>
    );
};
