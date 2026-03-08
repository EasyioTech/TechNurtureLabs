'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { UserCircle2, Zap, Trophy, School, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export const StudentRegistrationSidebar = ({ settings }: { settings?: any }) => {
    return (
        <div className="hidden lg:flex flex-[0.8] relative overflow-hidden bg-[#FDFDFF] border-r border-slate-200/50 z-20">
            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-[120px] -mr-48 -mt-48" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-50/30 rounded-full blur-[100px] -ml-32 -mb-32" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] pointer-events-none" />
            </div>

            <div className="relative z-10 w-full h-full flex flex-col justify-between p-14">
                <header>
                    <Link href="/" className="flex items-center gap-3 group w-fit transition-transform hover:scale-[1.02]">
                        {settings?.logo_url ? (
                            <div className="w-14 h-14 flex items-center justify-center transition-transform group-hover:rotate-3">
                                <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain" />
                            </div>
                        ) : (
                            <div className="w-14 h-14 rounded-[1.25rem] bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-600/20 group-hover:rotate-3 transition-transform">
                                <School className="text-white" size={28} />
                            </div>
                        )}
                        {settings?.show_platform_name !== false && (
                            <div>
                                <span className="text-2xl font-black tracking-tighter text-slate-950 block leading-none">{settings?.platform_name || 'TechNurture'}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] ml-0.5 mt-1 block">Student Portal</span>
                            </div>
                        )}
                    </Link>
                </header>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-md w-full"
                >
                    <div className="mb-10 relative group">
                        <div className="absolute -inset-10 bg-gradient-to-tr from-blue-100/20 to-indigo-100/20 rounded-[4rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        <img
                            src="/illustrations/hero-learning.svg"
                            alt="Learning Illustration"
                            className="relative z-10 w-full h-auto max-h-[300px] drop-shadow-[0_20px_50px_rgba(0,0,0,0.06)] transition-all duration-700 group-hover:scale-105 group-hover:-rotate-1"
                        />
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100/50 mb-6">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest">Enrollment Open 2024-25</span>
                    </div>

                    <h2 className="text-[48px] font-black mb-6 text-slate-950 leading-[0.95] tracking-tight">
                        A modern <br />
                        <span className="text-indigo-600 relative inline-block">
                            learning
                            <svg className="absolute -bottom-2 left-0 w-full h-3 text-indigo-100 -z-10" viewBox="0 0 100 20" preserveAspectRatio="none">
                                <path d="M0 10 Q 25 20 50 10 T 100 10" stroke="currentColor" strokeWidth="8" fill="none" />
                            </svg>
                        </span> experience.
                    </h2>

                    <p className="text-slate-500 text-lg font-medium leading-relaxed mb-10 max-w-[90%]">
                        Transform the way you learn with world-class resources designed specifically for your academic and creative growth.
                    </p>

                    <div className="grid gap-4">
                        {[
                            { icon: <UserCircle2 size={18} />, label: "Smart Profile", desc: "Interactive dashboard tracking." },
                            { icon: <Zap size={18} />, label: "Fast Track", desc: "Adaptive learning algorithms." },
                            { icon: <Trophy size={18} />, label: "Global Ranking", desc: "Compete with students globally." }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + (i * 0.1) }}
                                className="flex items-center gap-5 p-5 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:rotate-6">
                                    {item.icon}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 text-[15px] tracking-tight">{item.label}</p>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                <footer className="flex items-center justify-between pt-10 border-t border-slate-100/60">
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-9 h-9 rounded-full border-2 border-white bg-slate-100 shadow-sm overflow-hidden">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=student${i}`} alt="Student" className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">12k+ Active Students</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-indigo-600">
                        <CheckCircle2 size={14} className="stroke-[3]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Accredited</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};
