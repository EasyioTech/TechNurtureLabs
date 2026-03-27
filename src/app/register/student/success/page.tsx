'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
    CheckCircle2, 
    LogIn, 
    Sparkles, 
    Zap, 
    Trophy, 
    ShieldCheck, 
    ArrowRight,
    Clock,
    School
} from 'lucide-react';
import { getPlatformSettings } from '@/components/landing/actions';

export default function StudentRegistrationSuccess() {
    const [platformSettings, setPlatformSettings] = useState<any>(null);

    useEffect(() => {
        getPlatformSettings().then(setPlatformSettings);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-950 flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-x-hidden">
            {/* Ambient Background Elements - Optimized for performance */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-100/40 rounded-full blur-[100px]" />
                <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="relative z-10 w-full max-w-xl bg-white border border-white/80 rounded-[32px] sm:rounded-[40px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] p-6 sm:p-10 text-center backdrop-blur-xl"
            >
                {/* Logo Header - more compact */}
                <div className="flex items-center justify-center gap-2 mb-6 sm:mb-8">
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 shadow-md">
                        {platformSettings?.logo_url ? (
                            <img src={platformSettings.logo_url} alt="Logo" className="w-5 h-5 object-contain" />
                        ) : (
                            <Sparkles className="text-white" size={16} />
                        )}
                    </div>
                    <span className="text-base font-black tracking-tight text-slate-900">
                        {platformSettings?.platform_name || 'TechNurture'}
                    </span>
                </div>

                {/* Animated Success Icon - smaller on mobile */}
                <div className="relative mb-6 sm:mb-8 flex justify-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', damping: 12, stiffness: 200 }}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-inner relative z-10"
                    >
                        <CheckCircle2 size={40} className="sm:size-[48px]" strokeWidth={2.5} />
                    </motion.div>
                    
                    {/* Simplified floating icons for mobile height */}
                    <div className="hidden sm:block">
                        <motion.div 
                            animate={{ y: [0, -8, 0] }}
                            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                            className="absolute top-0 right-[35%] w-9 h-9 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-sm"
                        >
                            <Zap size={18} />
                        </motion.div>
                        <motion.div 
                            animate={{ y: [0, 8, 0] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0.5 }}
                            className="absolute bottom-2 left-[32%] w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shadow-sm"
                        >
                            <Trophy size={20} />
                        </motion.div>
                    </div>
                </div>

                <h1 className="text-2xl sm:text-4xl font-black text-slate-900 mb-1 sm:mb-3 tracking-tight">
                    Registration <span className="text-indigo-600">Complete!</span>
                </h1>
                <p className="text-slate-500 text-sm sm:text-lg font-medium mb-6 sm:mb-10 max-w-sm mx-auto leading-relaxed">
                    Great! Your profile is ready. One final step remains.
                </p>

                {/* Alert Box - Very compact on mobile */}
                <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 border border-slate-100 flex flex-row items-center gap-4 text-left hover:border-blue-200 transition-colors">
                    <div className="w-10 h-10 sm:w-16 sm:h-16 shrink-0 rounded-xl bg-white text-blue-600 flex items-center justify-center shadow-sm">
                        <School size={20} className="sm:size-[32px]" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-bold text-base sm:text-xl text-slate-900">School Approval</h3>
                            <Clock size={14} className="text-blue-500 animate-pulse" />
                        </div>
                        <p className="text-slate-500 text-[13px] sm:text-base font-medium leading-tight sm:leading-relaxed">
                            Verification usually takes less than 24 hours.
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <Link href="/login" className="flex-1">
                        <Button className="w-full h-12 sm:h-16 text-xs sm:text-base font-black rounded-xl sm:rounded-2xl bg-slate-900 hover:bg-slate-800 text-white shadow-lg transition-all uppercase tracking-widest flex items-center justify-center gap-2">
                            <LogIn size={16} />
                            Go to Login
                        </Button>
                    </Link>
                    <Link href="/" className="sm:px-6">
                        <Button variant="outline" className="w-full sm:w-auto h-12 sm:h-16 text-xs sm:text-base font-bold rounded-xl sm:rounded-2xl border-2 border-slate-100 hover:bg-slate-50 text-slate-600 transition-all px-8">
                            Home
                        </Button>
                    </Link>
                </div>

                <p className="text-[10px] sm:text-xs text-slate-400 font-semibold mt-6 sm:mt-10 uppercase tracking-wider">
                    Need help? Contact support
                </p>
            </motion.div>
        </div>
    );
}
