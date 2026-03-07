'use client';

import React from 'react';
import { Gamepad2, BarChart3, Users, Shield, BookOpen, Globe, ArrowRight } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { ScrollReveal } from './ScrollReveal';

export const BentoGridSection = () => {
    return (
        <section id="features" className="relative z-10 py-32 bg-[#0a0a0f]">
            <div className="max-w-7xl mx-auto px-6">

                <div className="text-center mb-20">
                    <ScrollReveal>
                        <span className="text-sm font-bold text-violet-400 uppercase tracking-widest bg-violet-500/10 py-2 px-4 rounded-full border border-violet-500/20">
                            Platform Features
                        </span>
                    </ScrollReveal>
                    <ScrollReveal delay={0.1}>
                        <h2 className="text-5xl md:text-6xl font-black mt-8 mb-6 tracking-tight">
                            A complete ecosystem for
                            <br />
                            <span className="text-white/40">modern education.</span>
                        </h2>
                    </ScrollReveal>
                </div>

                {/* CSS Custom Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[280px] gap-6">

                    {/* Main Feature - Gamification (Span 2x2) */}
                    <div className="md:col-span-2 md:row-span-2">
                        <ScrollReveal className="h-full" delay={0.2}>
                            <GlassCard glowColor="#8b5cf6" className="flex flex-col justify-between group overflow-hidden">
                                <div className="relative z-20">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-violet-500/20">
                                        <Gamepad2 size={32} className="text-white relative z-10" />
                                    </div>
                                    <h3 className="text-3xl font-bold mb-4">Gamified Learning Experience</h3>
                                    <p className="text-lg text-white/50 leading-relaxed max-w-md">
                                        XP points, streaks, badges, and dynamic leaderboards that make learning addictive and rewarding for students.
                                    </p>
                                </div>
                                {/* Decorative Element */}
                                <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 opacity-40 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none">
                                    <div className="w-64 h-64 bg-violet-500 rounded-full blur-[80px]" />
                                </div>
                            </GlassCard>
                        </ScrollReveal>
                    </div>

                    {/* Feature 2 (Span 1x1) */}
                    <div className="md:col-span-1 md:row-span-1">
                        <ScrollReveal className="h-full" delay={0.3}>
                            <GlassCard glowColor="#06b6d4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mb-5">
                                    <BookOpen size={24} className="text-white" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Interactive Courses</h3>
                                <p className="text-sm text-white/50 leading-relaxed">
                                    Video lessons, rich quizzes, and hands-on activities designed for deep engagement.
                                </p>
                            </GlassCard>
                        </ScrollReveal>
                    </div>

                    {/* Feature 3 (Span 1x2) */}
                    <div className="md:col-span-1 md:row-span-2">
                        <ScrollReveal className="h-full" delay={0.4}>
                            <GlassCard glowColor="#10b981" className="flex flex-col h-full bg-gradient-to-b from-[#13131a]/80 to-emerald-900/10">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-5">
                                    <BarChart3 size={24} className="text-white" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">Advanced Progress Analytics</h3>
                                <p className="text-white/50 leading-relaxed mb-8 flex-grow">
                                    Real-time insights into student performance, identifying learning patterns and areas for improvement instantly.
                                </p>

                                {/* Mock Chart UI */}
                                <div className="mt-auto h-32 w-full flex items-end justify-between gap-2 border-t border-white/5 pt-4">
                                    {[40, 70, 45, 90, 65, 100].map((height, i) => (
                                        <div key={i} className="w-full bg-emerald-500/20 rounded-t-sm relative group overflow-hidden" style={{ height: `${height}%` }}>
                                            <div className="absolute bottom-0 w-full bg-emerald-500 rounded-t-sm transition-all duration-1000 group-hover:bg-emerald-400" style={{ height: '0%', animation: `growUp 1s ease-out forwards ${i * 0.1}s` }} />
                                        </div>
                                    ))}
                                </div>
                                <style jsx>{`
                  @keyframes growUp {
                    to { height: 100%; }
                  }
                `}</style>
                            </GlassCard>
                        </ScrollReveal>
                    </div>

                    {/* Feature 4 (Span 1x1) */}
                    <div className="md:col-span-1 md:row-span-1">
                        <ScrollReveal className="h-full" delay={0.5}>
                            <GlassCard glowColor="#f59e0b">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-5">
                                    <Globe size={24} className="text-white" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Your Own Digital Campus</h3>
                                <p className="text-sm text-white/50 leading-relaxed">
                                    Launch a private, fully-branded portal for your school in minutes. Stand out with custom logos and themes.
                                </p>
                            </GlassCard>
                        </ScrollReveal>
                    </div>

                    {/* Horizontal Banner (Span 3x1) */}
                    <div className="md:col-span-3 md:row-span-1">
                        <ScrollReveal className="h-full" delay={0.6}>
                            <GlassCard glowColor="#f43f5e" className="flex flex-col md:flex-row items-center justify-between gap-8 h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-900/20 via-[#13131a]/80 to-[#13131a]/80">
                                <div className="flex-1">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center mb-4">
                                        <Shield size={24} className="text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2">Enterprise-Grade Security & Privacy</h3>
                                    <p className="text-white/50 max-w-xl">
                                        Bank-level encryption, absolute data privacy compliance, and strict role-based access control for absolute peace of mind.
                                    </p>
                                </div>
                                <div className="hidden md:flex w-32 h-32 relative items-center justify-center">
                                    <div className="absolute inset-0 border border-rose-500/30 rounded-full animate-[spin_10s_linear_infinite]" />
                                    <div className="absolute inset-2 border border-rose-500/20 rounded-full animate-[spin_8s_linear_infinite_reverse]" />
                                    <div className="absolute inset-4 border border-rose-500/10 rounded-full animate-[spin_6s_linear_infinite]" />
                                    <Shield size={40} className="text-rose-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
                                </div>
                            </GlassCard>
                        </ScrollReveal>
                    </div>

                    {/* Feature 6 (Span 1x1) */}
                    <div className="md:col-span-1 md:row-span-1">
                        <ScrollReveal className="h-full" delay={0.7}>
                            <GlassCard glowColor="#6366f1" className="flex flex-col justify-center items-center text-center group cursor-pointer hover:bg-indigo-900/10">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-500 flex-shrink-0 transition-all duration-300">
                                    <ArrowRight size={32} className="text-white" />
                                </div>
                                <h3 className="text-xl font-bold">Discover All Features</h3>
                            </GlassCard>
                        </ScrollReveal>
                    </div>

                </div>
            </div>
        </section>
    );
}
