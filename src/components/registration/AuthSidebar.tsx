'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface FeatureItem {
    icon: React.ReactNode;
    label: string;
    desc: string;
}

interface AuthSidebarProps {
    settings?: any;
    portalIcon: React.ReactNode;
    portalLabel: string;
    illustration: string;
    illustrationAlt: string;
    headline: React.ReactNode;
    subtitle: string;
    features: FeatureItem[];
    socialProofLabel: string;
    badgeLabel: string;
    badgeColor?: string;
    avatarSeeds: string[];
}

export const AuthSidebar = ({
    settings,
    portalIcon,
    portalLabel,
    illustration,
    illustrationAlt,
    headline,
    subtitle,
    features,
    socialProofLabel,
    badgeLabel,
    badgeColor = 'text-blue-600',
    avatarSeeds,
}: AuthSidebarProps) => {
    return (
        <div className="hidden lg:flex flex-[0.8] relative overflow-hidden bg-slate-50 border-r border-slate-200/60 z-10">

            {/* Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-[0.025]"
                    style={{
                        backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)',
                        backgroundSize: '48px 48px',
                    }}
                />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-[140px] -mr-40 -mt-40" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-100/20 rounded-full blur-[120px] -ml-32 -mb-32" />
            </div>

            <div className="relative z-10 w-full h-full flex flex-col justify-between p-10 xl:p-14">

                {/* Header */}
                <header>
                    <Link href="/" className="flex items-center gap-3 group w-fit">
                        {settings?.logo_url ? (
                            <div
                                className="flex items-center justify-center"
                                style={{ height: settings?.logo_height ? `${settings.logo_height}px` : '36px' }}
                            >
                                <img src={settings.logo_url} alt="Logo" className="w-auto h-full object-contain" />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                                {portalIcon}
                            </div>
                        )}
                        {settings?.show_platform_name !== false && (
                            <div>
                                <span className="text-lg font-black tracking-tight text-slate-900 block leading-none">
                                    {settings?.platform_name || 'TechNurture'}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.15em] mt-0.5 block">
                                    {portalLabel}
                                </span>
                            </div>
                        )}
                    </Link>
                </header>

                {/* Main Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-md w-full"
                >
                    {/* Illustration */}
                    <div className="mb-10">
                        <img
                            src={illustration}
                            alt={illustrationAlt}
                            className="w-full h-auto max-h-[260px] object-contain drop-shadow-sm"
                        />
                    </div>

                    {/* Headline */}
                    <h2 className="text-[36px] xl:text-[42px] font-black mb-4 text-slate-900 leading-[1.05] tracking-tight">
                        {headline}
                    </h2>

                    {/* Subtitle */}
                    <p className="text-slate-500 text-base font-medium leading-relaxed mb-8 max-w-sm">
                        {subtitle}
                    </p>

                    {/* Feature Cards */}
                    <div className="space-y-2.5">
                        {features.map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + (i * 0.08) }}
                                className="flex items-center gap-4 p-3.5 rounded-2xl bg-white border border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-slate-200 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:border-slate-900 group-hover:text-white transition-all shrink-0">
                                    {item.icon}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-slate-800 text-sm tracking-tight">{item.label}</p>
                                    <p className="text-[11px] font-medium text-slate-400">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Footer */}
                <footer className="flex items-center justify-between pt-8 border-t border-slate-200/60">
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                            {avatarSeeds.map((seed, i) => (
                                <div key={i} className="w-7 h-7 rounded-full border-2 border-slate-50 bg-slate-200 shadow-sm overflow-hidden">
                                    <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${seed}`} alt="" className="w-full h-full" />
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em]">{socialProofLabel}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 ${badgeColor}`}>
                        <CheckCircle2 size={13} className="stroke-[2.5]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em]">{badgeLabel}</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};
