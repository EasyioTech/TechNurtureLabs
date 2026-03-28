'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Send, Sparkles, CheckCircle2 } from 'lucide-react';
import { PrimaryButton } from '@/components/landing/PrimaryButton';
import { ScrollReveal } from '@/components/landing/ScrollReveal';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSent(true);
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-1/4 w-[800px] h-[600px] bg-blue-100/40 rounded-full blur-[120px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.02]"
                    style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            </div>

            <div className="flex-1 flex flex-col relative z-10 p-6 md:p-12">
                <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col md:flex-row gap-12 items-center justify-center">

                    <div className="hidden lg:block w-1/2 max-w-lg">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8 }}
                            className="relative flex items-center justify-center"
                        >
                            <img
                                src={isSent ? "/assets/email.svg" : "/assets/forgot-password.svg"}
                                alt="Account Recovery"
                                className="w-full h-auto object-contain mix-blend-multiply opacity-90 transition-all duration-700 hover:scale-110"
                            />
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
                        className="w-full max-w-md bg-white p-8 md:p-12 rounded-[3rem] border border-slate-200 shadow-2xl relative overflow-hidden"
                    >
                        {/* Decorative Label */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-slate-200 shadow-sm mb-6">
                            <Sparkles size={14} className="text-blue-600" />
                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Account Recovery</span>
                        </div>

                        {!isSent ? (
                            <>
                                <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight">Lost your access?</h1>
                                <p className="text-slate-500 font-medium mb-10 text-base leading-relaxed">
                                    No worries. Enter your registered email address and we'll send a recovery gateway to your inbox instantly.
                                </p>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registered Email Address</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner"
                                            placeholder="scholar@technurture.io"
                                            required
                                        />
                                    </div>
                                    <PrimaryButton variant="primary" type="submit" className="w-full !h-14 !bg-slate-900 !rounded-xl !font-black !uppercase !tracking-widest shadow-xl shadow-slate-900/20">
                                        Send Recovery Link
                                        <Send className="ml-2" size={18} />
                                    </PrimaryButton>
                                </form>
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-8 border-2 border-emerald-100 shadow-inner">
                                    <CheckCircle2 size={40} />
                                </div>
                                <h1 className="text-3xl font-black mb-4 tracking-tight">Recovery Initialized</h1>
                                <p className="text-slate-500 font-medium mb-10 text-base leading-relaxed">
                                    A secure access link has been dispatched to <strong>{email}</strong>.
                                    Please check your inbox or spam folder within the next 5 minutes.
                                </p>
                                <Link href="/login" className="block">
                                    <PrimaryButton variant="flat" className="w-full !h-14 !rounded-xl !font-black !uppercase !tracking-widest">
                                        Return to Access Point
                                    </PrimaryButton>
                                </Link>
                            </div>
                        )}

                        <div className="mt-10 pt-8 border-t border-slate-100">
                            <Link href="/login" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors">
                                <ArrowLeft size={14} /> Back to Sign In Endpoint
                            </Link>
                        </div>
                    </motion.div>

                </div>
            </div>

            <footer className="fixed bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em] z-10">
                Secure Recovery Gateway Protocol · 2026
            </footer>
        </div>
    );
}
