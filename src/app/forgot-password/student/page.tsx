'use client';

import React, { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Send, GraduationCap, CheckCircle2 } from 'lucide-react';
import { PrimaryButton } from '@/components/landing/PrimaryButton';
import { requestPinReset } from '@/modules/auth/pin-actions';

function ForgotPinForm() {
    const searchParams = useSearchParams();
    const [identifier, setIdentifier] = useState(searchParams.get('identifier') || '');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!identifier.trim()) {
            toast.error('Please enter your email or phone number.');
            return;
        }

        setLoading(true);
        const result = await requestPinReset(identifier);
        setLoading(false);

        if (result.success) {
            setSubmitted(true);
            toast.success(result.message);
        } else {
            toast.error(result.error);
        }
    };

    if (submitted) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
            >
                <div className="w-20 h-20 bg-emerald-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <CheckCircle2 className="text-emerald-500" size={40} />
                </div>
                <h1 className="text-3xl font-black mb-4 text-slate-900 uppercase tracking-tighter">Request <span className="text-emerald-600">Sent!</span></h1>
                <p className="text-slate-500 font-bold mb-10 leading-relaxed text-sm">
                    We&apos;ve informed your school that you need a PIN reset. 
                    Your teacher or coordinator will review this and provide you with a new 6-digit PIN.
                </p>
                <Link href="/login">
                    <PrimaryButton variant="primary" className="w-full !h-16 !bg-slate-950 font-black uppercase tracking-widest !rounded-2xl shadow-xl shadow-slate-950/20 active:scale-95 transition-all">
                        Return to Login
                    </PrimaryButton>
                </Link>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <Link href="/login" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-10 transition-all font-black uppercase tracking-[0.2em] text-[10px] group">
                <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                Back to Access
            </Link>

            <h1 className="text-5xl font-black mb-4 text-slate-950 tracking-tighter leading-[0.9] uppercase">Locked <span className="text-indigo-600">Out?</span></h1>
            <p className="text-slate-500 font-bold mb-12 text-base leading-relaxed">Don&apos;t worry. Your school administration can securely reset your 6-digit PIN.</p>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-3">
                    <Label className="text-[10px] ml-1 uppercase tracking-[0.25em] font-black text-slate-400">Identify Yourself</Label>
                    <div className="relative group">
                        <Input
                            type="text"
                            autoFocus
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className="bg-white h-16 px-6 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-lg pointer-events-auto"
                            placeholder="Email address or Phone"
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                            <GraduationCap size={20} />
                        </div>
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Use the information linked to your student account.</p>
                </div>

                <PrimaryButton
                    type="submit"
                    disabled={loading}
                    variant="primary"
                    className="w-full !h-16 !bg-slate-950 hover:!bg-indigo-600 shadow-2xl shadow-slate-950/10 transition-all font-black uppercase tracking-widest !rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : (
                        <>
                            Notify My School
                            <Send size={18} />
                        </>
                    )}
                </PrimaryButton>
            </form>
        </motion.div>
    );
}

export default function StudentForgotPinPage() {
    return (
        <div className="min-h-screen bg-white text-slate-900 flex font-sans selection:bg-indigo-100 relative overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 opacity-60" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-slate-50 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 opacity-60" />
            
            {/* Grid Overlay */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
            </div>

            <div className="max-w-md w-full mx-auto px-6 py-20 relative z-10 flex flex-col justify-center min-h-screen">
                <Suspense fallback={<div className="flex justify-center"><Loader2 className="animate-spin text-slate-400" size={32} /></div>}>
                    <ForgotPinForm />
                </Suspense>

                {/* Footer Security Badge */}
                <div className="mt-16 pt-8 border-t border-slate-50 flex flex-col items-center gap-6">
                    <div className="flex items-center gap-3 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
                        <div className="w-8 h-8 rounded-xl bg-slate-950 flex items-center justify-center shadow-lg">
                            <ShieldCheck size={16} className="text-white" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Secure Access Protocol</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ShieldCheck({ size, className }: { size: number, className: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    );
}
