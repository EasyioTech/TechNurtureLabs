'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Users, BookOpen, Clock, ChevronRight, Activity, Award } from 'lucide-react';

export const HeroSectionLight = ({ settings }: { settings?: any }) => {
    return (
        <section className="relative min-h-screen bg-[#F8F9FA] flex flex-col items-center pt-32 pb-20 overflow-hidden font-sans">

            {/* 1. Header & Intro */}
            <div className="max-w-7xl mx-auto px-6 w-full text-center z-10 mb-16">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-white shadow-sm mb-6"
                >
                    <span className="flex h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Platform Update v2.4</span>
                    <ChevronRight size={10} className="text-slate-300" />
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1, ease: [0.19, 1, 0.22, 1] }}
                    className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight mb-6 max-w-4xl mx-auto"
                >
                    Nurturing the <br />
                    <span className="text-blue-600">Architects of Tomorrow.</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.19, 1, 0.22, 1] }}
                    className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed mb-10"
                >
                    A minimalist K-12 learning infrastructure designed for precision,
                    psychological engagement, and measurable student outcomes.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: [0.19, 1, 0.22, 1] }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <Link href="/register/student" className="w-full sm:w-auto">
                        <button className="w-full sm:w-auto px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5 flex items-center justify-center gap-2">
                            Start building for free
                            <ArrowRight size={18} />
                        </button>
                    </Link>
                    <Link href="#solutions" className="w-full sm:w-auto">
                        <button className="w-full sm:w-auto px-10 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                            Explore Solutions
                        </button>
                    </Link>
                </motion.div>
            </div>

            {/* 2. Bento Grid Illustration */}
            <div className="max-w-6xl mx-auto px-6 w-full grid grid-cols-1 md:grid-cols-4 grid-rows-auto gap-4 md:auto-rows-[160px]">

                {/* Main Dashboard Preview / Hero Image Spanning 2x2 */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="md:col-span-2 md:row-span-2 bg-white border border-slate-200 rounded-3xl p-8 flex flex-col justify-between shadow-sm relative overflow-hidden group"
                >
                    <div className="z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                <Activity className="text-blue-600" size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 leading-tight">Student Engagement</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Real-time Metrics</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {[75, 45, 90].map((w, i) => (
                                <div key={i} className="space-y-1.5">
                                    <div className="flex justify-between text-[11px] font-bold text-slate-500">
                                        <span>Course Completion</span>
                                        <span className="text-slate-900">{w}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${w}%` }}
                                            transition={{ duration: 1, delay: 0.6 + (i * 0.1) }}
                                            className="h-full bg-blue-600 rounded-full"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Decorative pattern */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[100px] -z-0 opacity-50 group-hover:scale-110 transition-transform duration-500" />
                </motion.div>

                {/* Growth Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="md:col-span-1 md:row-span-1 bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between shadow-sm"
                >
                    <div className="flex justify-between items-start">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <TrendingUp className="text-emerald-600" size={16} />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+12.4%</span>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Student Growth</p>
                        <p className="text-2xl font-black text-slate-900 tracking-tight">854 <span className="text-xs font-bold text-slate-300">New</span></p>
                    </div>
                </motion.div>

                {/* Users Count */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="md:col-span-1 md:row-span-1 bg-slate-900 rounded-3xl p-6 flex flex-col justify-between shadow-xl"
                >
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                        <Users className="text-white" size={16} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Active Learners</p>
                        <p className="text-2xl font-black text-white tracking-tight">45.2k</p>
                    </div>
                </motion.div>

                {/* Expert Mentors Tile */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    className="md:col-span-1 md:row-span-2 bg-[#F1F3F5] border border-slate-200 rounded-3xl p-6 flex flex-col justify-center items-center text-center gap-4 group"
                >
                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover:rotate-6 transition-transform">
                        <Award className="text-blue-600" size={28} />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-slate-900 tracking-tight">500+</p>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Expert Mentors</p>
                    </div>
                    <div className="h-px w-8 bg-slate-300"></div>
                    <p className="text-[11px] text-slate-400 font-medium">Curating curriculum for the next generation.</p>
                </motion.div>

                {/* Small Interactive Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="md:col-span-1 md:row-span-1 bg-white border border-slate-200 rounded-3xl p-6 flex items-center gap-4 hover:border-blue-200 transition-colors group cursor-pointer"
                >
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Clock className="text-orange-500" size={18} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-900 leading-tight">Live Workshops</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Starts in 12m</p>
                    </div>
                </motion.div>

                {/* Curriculum Tile */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.9 }}
                    className="md:col-span-2 md:row-span-1 bg-white border border-slate-200 rounded-3xl p-6 flex flex-row items-center justify-between shadow-sm relative overflow-hidden"
                >
                    <div className="flex flex-col">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Curriculum Spotlight</p>
                        <h4 className="text-base font-black text-slate-900 mb-1">Design Systems for Kids</h4>
                        <p className="text-xs text-slate-500 font-medium max-w-xs">Building fundamental logic through visual hierarchy and component architecture.</p>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                        <BookOpen className="text-slate-400" size={24} />
                    </div>
                    <div className="absolute bottom-0 left-0 h-1 w-full bg-blue-600/5"></div>
                </motion.div>

            </div>

            {/* Subtle floating background elements (Not using typical flashy gradients) */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-slate-200 opacity-[0.15] blur-[120px] rounded-full -z-0 pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-100 opacity-[0.1] blur-[100px] rounded-full -z-0 pointer-events-none"></div>

        </section>
    );
};
