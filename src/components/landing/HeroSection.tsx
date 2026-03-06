'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GraduationCap, Play, Trophy, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollReveal } from './ScrollReveal';
import { GlassCard } from './GlassCard';

export const HeroSection = () => {
    return (
        <section className="relative z-10 pt-32 pb-32 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center max-w-5xl mx-auto">

                    <ScrollReveal delay={0.1} direction="up" duration={0.8}>
                        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 mb-10 backdrop-blur-md shadow-lg shadow-black/20">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <span className="text-sm font-medium tracking-wide text-white/80">Now enrolling schools across India</span>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal delay={0.2} direction="up" duration={0.8}>
                        <h1 className="text-6xl md:text-8xl lg:text-[8rem] font-black tracking-tighter leading-[0.9] mb-8">
                            Learning that
                            <br />
                            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent pb-4 inline-block">
                                feels like play
                            </span>
                        </h1>
                    </ScrollReveal>

                    <ScrollReveal delay={0.3} direction="up" duration={0.8}>
                        <p className="text-xl md:text-2xl text-white/50 max-w-3xl mx-auto mb-12 leading-relaxed font-light mt-4">
                            Transform your school with gamified learning experiences. XP, streaks,
                            achievements, and interactive journeys that keep students engaged.
                        </p>
                    </ScrollReveal>

                    <ScrollReveal delay={0.4} direction="up" duration={0.8}>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-24 relative z-20">
                            <Link href="/register/student">
                                <Button size="lg" className="bg-white hover:bg-white/90 text-black font-bold px-10 h-16 text-lg rounded-2xl shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] w-full sm:w-auto transition-all group">
                                    <GraduationCap className="mr-2 group-hover:scale-110 transition-transform" size={24} />
                                    Start Learning Now
                                </Button>
                            </Link>
                            <Link href="/login">
                                <Button size="lg" variant="outline" className="border-white/10 bg-white/5 backdrop-blur-md text-white hover:bg-white/10 hover:border-white/20 font-bold px-10 h-16 text-lg rounded-2xl w-full sm:w-auto transition-all">
                                    Already have an account?
                                </Button>
                            </Link>
                        </div>
                    </ScrollReveal>

                    {/* Hero Media / Illustration */}
                    <ScrollReveal delay={0.6} direction="up" duration={1} className="relative z-10">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent z-10 pointer-events-none" />
                        <div className="relative rounded-[2.5rem] p-3 backdrop-blur-2xl bg-white/5 border border-white/10 shadow-2xl overflow-visible">
                            <div className="rounded-[2rem] overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 relative group">
                                <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/20 to-cyan-500/20 mix-blend-overlay z-10"></div>
                                <img
                                    src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&q=80"
                                    alt="Students learning"
                                    className="w-full h-[400px] md:h-[600px] object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-1000"
                                />
                                <div className="absolute inset-0 flex items-center justify-center z-20">
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-2xl flex items-center justify-center border border-white/20 shadow-2xl group-hover:bg-white/20 transition-colors"
                                    >
                                        <Play size={40} className="text-white ml-2 drop-shadow-lg" fill="white" />
                                    </motion.button>
                                </div>
                            </div>

                            {/* Floating Achievements */}
                            <div className="absolute -left-12 top-1/4 hidden lg:block z-30 pointer-events-none">
                                <motion.div
                                    initial={{ opacity: 0, x: -20, y: 10 }}
                                    animate={{ opacity: 1, x: 0, y: [0, -10, 0] }}
                                    transition={{ delay: 1, y: { duration: 4, repeat: Infinity, ease: "easeInOut" } }}
                                >
                                    <GlassCard className="p-4 flex items-center gap-4 rounded-2xl">
                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                                            <Trophy size={28} className="text-white" />
                                        </div>
                                        <div className="text-left pr-4">
                                            <p className="text-sm font-bold text-white">First Lesson Complete</p>
                                            <p className="text-xs text-white/50 font-medium tracking-wide uppercase mt-1">Achievement</p>
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            </div>

                            <div className="absolute -right-12 bottom-1/4 hidden lg:block z-30 pointer-events-none">
                                <motion.div
                                    initial={{ opacity: 0, x: 20, y: -10 }}
                                    animate={{ opacity: 1, x: 0, y: [0, 10, 0] }}
                                    transition={{ delay: 1.2, y: { duration: 5, repeat: Infinity, ease: "easeInOut" } }}
                                >
                                    <GlassCard className="p-4 flex items-center gap-4 rounded-2xl border-emerald-500/20">
                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                            <Zap size={28} className="text-white" />
                                        </div>
                                        <div className="text-left pr-4">
                                            <p className="text-2xl font-black text-white">+250 XP</p>
                                            <p className="text-xs text-emerald-400 font-medium tracking-wide uppercase mt-1">Daily Streak</p>
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            </div>
                        </div>
                    </ScrollReveal>

                </div>
            </div>
        </section>
    );
}
