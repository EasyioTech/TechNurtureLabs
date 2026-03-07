'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Zap, Trophy, School, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export const StudentLoginSidebar = ({ settings }: { settings?: any }) => {
    return (
        <div className="hidden lg:flex flex-[0.8] relative overflow-hidden bg-[#FDFDFF] border-r border-slate-200/50 z-10">
            {/* Premium Background Elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-50/40 rounded-full blur-[120px] -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-50/30 rounded-full blur-[100px] -ml-24 -mb-24" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.015] pointer-events-none" />
            </div>

            <div className="relative z-10 w-full h-full flex flex-col justify-between p-14">
                <header>
                    <Link href="/" className="flex items-center gap-3 group w-fit transition-transform hover:scale-[1.02]">
                        {settings?.logo_url ? (
                            <div className="w-14 h-14 rounded-[1.25rem] bg-white flex items-center justify-center shadow-2xl shadow-slate-950/20 group-hover:rotate-3 transition-all p-2 border border-slate-100">
                                <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain" />
                            </div>
                        ) : (
                            <div className="w-14 h-14 rounded-[1.25rem] bg-slate-950 flex items-center justify-center shadow-2xl shadow-slate-950/20 group-hover:rotate-3 transition-transform">
                                <GraduationCap className="text-white" size={28} />
                            </div>
                        )}
                        <div>
                            <span className="text-2xl font-black tracking-tighter text-slate-950 block leading-none">{settings?.platform_name || 'TechNurture'}</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] ml-0.5 mt-1 block">Student Portal</span>
                        </div>
                    </Link>
                </header>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-md w-full"
                >
                    <div className="mb-12 relative group">
                        <div className="absolute -inset-8 bg-gradient-to-tr from-indigo-100/30 to-blue-100/30 rounded-[4rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        <img
                            src="/illustrations/hero-learning.svg"
                            alt="Learning Illustration"
                            className="relative z-10 w-full h-auto max-h-[320px] drop-shadow-[0_20px_50px_rgba(0,0,0,0.06)] transition-all duration-700 group-hover:scale-105 group-hover:rotate-1"
                        />
                    </div>

                    <h2 className="text-[48px] font-black mb-6 text-slate-950 leading-[0.95] tracking-tight">
                        Continue your <br />
                        <span className="text-indigo-600 relative inline-block">
                            learning
                            <svg className="absolute -bottom-2 left-0 w-full h-3 text-indigo-100 -z-10" viewBox="0 0 100 20" preserveAspectRatio="none">
                                <path d="M0 10 Q 25 20 50 10 T 100 10" stroke="currentColor" strokeWidth="8" fill="none" />
                            </svg>
                        </span> journey.
                    </h2>

                    <p className="text-slate-500 text-lg font-medium leading-relaxed mb-10 max-w-[90%]">
                        Access your courses, track your personal milestones, and continue building your future.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { icon: <Zap size={18} />, label: "Streaks", desc: "Daily Wins" },
                            { icon: <Trophy size={18} />, label: "Badges", desc: "Your Rewards" },
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col gap-2 p-5 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group">
                                <div className="w-11 h-11 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:-rotate-6">
                                    {item.icon}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 text-sm tracking-tight">{item.label}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <footer className="flex items-center justify-between pt-10 border-t border-slate-100/60">
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-3">
                            {[7, 8, 9].map(i => (
                                <div key={i} className="w-9 h-9 rounded-full border-2 border-white bg-slate-100 shadow-sm overflow-hidden">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=student${i}`} alt="Student" className="w-full h-full opacity-80" />
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Join 12k+ Learners</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600">
                        <CheckCircle2 size={14} className="stroke-[3]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Secure Access</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};
