'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Presentation, Sparkles, CheckCircle2, Flame, Trophy, BookOpen, Gamepad2, TrendingUp } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

export const HeroSectionLight = ({ settings }: { settings?: any }) => {
    return (
        <section className="relative z-10 pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white">
            {/* Ultra-minimal Background */}
            <div className="absolute inset-0 bg-[radial-gradient(#f1f5f9_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-12 items-center">

                    {/* Left Column: Copy & CTAs */}
                    <div className="flex flex-col items-start text-left max-w-2xl mx-auto lg:mx-0">

                        <ScrollReveal delay={0.1} direction="up" duration={0.8}>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 shadow-sm mb-6">
                                {settings?.logo_url ? (
                                    <img src={settings.logo_url} alt="Logo" className="w-4 h-4 object-contain grayscale" />
                                ) : (
                                    <Sparkles size={14} className="text-slate-900" />
                                )}
                                {settings?.show_platform_name !== false && (
                                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">{settings?.platform_name || 'TechNurture'} Labs</span>
                                )}
                            </div>
                        </ScrollReveal>

                        <ScrollReveal delay={0.2} direction="up" duration={0.8}>
                            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6 text-slate-900">
                                Education <span className="font-[family-name:var(--font-playfair)] italic font-medium pr-0.5 text-slate-600">I</span>nfrastructure that <span className="text-blue-600"><span className="font-[family-name:var(--font-playfair)] italic font-medium pr-0.5">S</span>cales.</span>
                            </h1>
                        </ScrollReveal>

                        <ScrollReveal delay={0.3} direction="up" duration={0.8}>
                            <p className="text-lg text-slate-500 mb-10 leading-relaxed font-medium max-w-xl">
                                A unified, architecturally clean operating system for K-12 institutions. Drive measurable student outcomes without the cognitive overload.
                            </p>
                        </ScrollReveal>

                        <ScrollReveal delay={0.4} direction="up" duration={0.8}>
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                                <Link href="/register/student" className="w-full sm:w-auto">
                                    <motion.button
                                        whileHover={{ y: -1 }}
                                        whileTap={{ y: 1 }}
                                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-8 py-4 rounded-xl shadow-md transition-all text-sm tracking-wide cursor-pointer"
                                    >
                                        Start Free Trial
                                        <ArrowRight size={16} />
                                    </motion.button>
                                </Link>
                                <Link href="#demo" className="w-full sm:w-auto">
                                    <motion.button
                                        whileHover={{ y: -1, backgroundColor: '#f8fafc' }}
                                        whileTap={{ y: 1 }}
                                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-slate-700 font-semibold px-8 py-3.5 rounded-xl border border-slate-200 transition-all text-sm tracking-wide cursor-pointer"
                                    >
                                        <Presentation size={16} className="text-slate-400" />
                                        Book a Demo
                                    </motion.button>
                                </Link>
                            </div>
                            <div className="flex items-center gap-6 mt-6 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                                <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-slate-300" /> No credit card</div>
                                <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-slate-300" /> 14-day trial</div>
                            </div>
                        </ScrollReveal>
                    </div>

                    {/* Right Column: Minimalist Bento Grid */}
                    <div className="w-full max-w-[560px] mx-auto lg:ml-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8 }}
                            className="grid grid-cols-2 gap-4"
                        >
                            {/* Card 1: Consistency (Loss Aversion) */}
                            <motion.div
                                whileHover={{ y: -2 }}
                                className="col-span-1 row-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between group cursor-default"
                            >
                                <div className="space-y-4">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 mb-6 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                                        <Flame size={18} className="text-slate-900 group-hover:text-blue-600 transition-colors" />
                                    </div>
                                    <h3 className="text-xl font-bold tracking-tight text-slate-900">Habit<br />Formation</h3>
                                    <p className="text-xs font-medium text-slate-500 leading-relaxed">Leveraging the endowment effect. Students protect their streaks, driving daily engagement.</p>
                                </div>
                                <div className="mt-8 space-y-3">
                                    <div className="flex items-end justify-between">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Streak</span>
                                        <span className="text-sm font-black text-slate-900">14 Days</span>
                                    </div>
                                    <div className="flex gap-1 h-12 items-end">
                                        {[40, 60, 30, 80, 50, 90, 100].map((height, i) => (
                                            <div key={i} className="flex-1 bg-slate-100 rounded-sm relative overflow-hidden">
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${height}%` }}
                                                    transition={{ duration: 1, delay: i * 0.1 }}
                                                    className={`absolute bottom-0 left-0 right-0 rounded-sm ${i === 6 ? 'bg-blue-600' : 'bg-slate-300'}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Card 2: Status (Social Proof) - Dark focal point */}
                            <motion.div
                                whileHover={{ y: -2 }}
                                className="col-span-1 bg-slate-900 rounded-3xl p-6 shadow-xl flex flex-col justify-between cursor-default relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
                                    <TrendingUp size={100} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <TrendingUp size={16} className="text-blue-400" />
                                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Percentile Rank</span>
                                    </div>
                                    <h3 className="text-3xl font-black text-white tracking-tighter mb-1">Top 1%</h3>
                                    <p className="text-[11px] font-medium text-slate-400 leading-relaxed">Relative performance tracking establishes high-status social proof.</p>
                                </div>
                            </motion.div>

                            {/* Card 3: Mastery (Goal Gradient) */}
                            <motion.div
                                whileHover={{ y: -2 }}
                                className="col-span-1 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between cursor-default"
                            >
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <BookOpen size={16} className="text-slate-400" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Knowledge Mastery</span>
                                    </div>
                                    <div className="space-y-2 mb-4">
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-sm font-bold text-slate-900 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">Advanced Calc</span>
                                            <span className="text-[10px] font-bold text-slate-500">92%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: '92%' }}
                                                transition={{ duration: 1.2, delay: 0.5 }}
                                                className="h-full bg-blue-600 rounded-full"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[11px] font-medium text-slate-500 leading-relaxed">Visual completion proximity triggers the goal gradient effect.</p>
                                </div>
                            </motion.div>

                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
};
