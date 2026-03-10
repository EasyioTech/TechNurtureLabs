'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Sparkles, Menu, X, ArrowRight, GraduationCap, School } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
    { label: 'Curriculum', href: '#features' },
    { label: 'Solutions', href: '#solutions' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'About', href: '#about' },
];

export const FlatNavigation = ({ settings }: { settings?: any }) => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('');

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 30);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Track active section for nav highlight
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection('#' + entry.target.id);
                    }
                });
            },
            { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
        );

        navLinks.forEach((link) => {
            const id = link.href.replace('#', '');
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [mobileMenuOpen]);

    const closeMobile = useCallback(() => setMobileMenuOpen(false), []);

    return (
        <>
            <nav className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out",
                scrolled
                    ? "bg-white/85 backdrop-blur-2xl border-b border-slate-900/[0.06] py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                    : "bg-transparent border-b border-transparent py-4"
            )}>
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between">

                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
                            {settings?.logo_url ? (
                                <img
                                    src={settings.logo_url}
                                    alt="Logo"
                                    className="h-8 w-auto object-contain transition-transform group-hover:scale-[1.02]"
                                    style={{ height: settings?.logo_height ? `${settings.logo_height}px` : '32px' }}
                                />
                            ) : (
                                <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                                    <Sparkles className="text-white" size={16} />
                                </div>
                            )}
                            {settings?.show_platform_name !== false && (
                                <span className="text-lg font-black text-slate-900 tracking-tight">
                                    {settings?.platform_name || 'TechNurture'}
                                </span>
                            )}
                        </Link>

                        {/* Center Nav Links — pill-style with active indicator */}
                        <div className="hidden lg:flex items-center">
                            <div className={cn(
                                "flex items-center gap-1 rounded-full px-1.5 py-1.5 transition-all duration-300",
                                scrolled ? "bg-slate-100/80" : "bg-slate-900/[0.04]"
                            )}>
                                {navLinks.map((link) => {
                                    const isActive = activeSection === link.href;
                                    return (
                                        <Link
                                            key={link.label}
                                            href={link.href}
                                            className={cn(
                                                "relative px-4 py-2 text-[13px] font-semibold rounded-full transition-all duration-200",
                                                isActive
                                                    ? "text-slate-900 bg-white shadow-sm"
                                                    : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
                                            )}
                                        >
                                            {link.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="hidden lg:flex items-center gap-3 shrink-0">
                            <Link
                                href="/school-portal/login"
                                className={cn(
                                    "flex items-center gap-2 text-[13px] font-semibold px-4 py-2.5 rounded-xl transition-all",
                                    "text-slate-600 hover:text-slate-900",
                                    scrolled
                                        ? "hover:bg-slate-100"
                                        : "hover:bg-slate-900/[0.04]"
                                )}
                            >
                                <School size={15} className="text-slate-400" />
                                School Login
                            </Link>

                            <Link
                                href="/login"
                                className="flex items-center gap-2 text-[13px] font-semibold text-white bg-slate-900 hover:bg-slate-800 px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-[1px] active:translate-y-0"
                            >
                                Student Login
                                <ArrowRight size={14} />
                            </Link>
                        </div>

                        {/* Mobile Toggle */}
                        <button
                            className="lg:hidden relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            <AnimatePresence mode="wait" initial={false}>
                                {mobileMenuOpen ? (
                                    <motion.div
                                        key="close"
                                        initial={{ opacity: 0, rotate: -90 }}
                                        animate={{ opacity: 1, rotate: 0 }}
                                        exit={{ opacity: 0, rotate: 90 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <X size={20} className="text-slate-700" />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="menu"
                                        initial={{ opacity: 0, rotate: 90 }}
                                        animate={{ opacity: 1, rotate: 0 }}
                                        exit={{ opacity: 0, rotate: -90 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <Menu size={20} className="text-slate-700" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu — full overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-[49] bg-black/20 backdrop-blur-sm lg:hidden"
                            onClick={closeMobile}
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                            className="fixed top-0 left-0 right-0 z-50 lg:hidden bg-white pt-20 pb-8 px-6 border-b border-slate-100 shadow-xl"
                        >
                            {/* Close button overlaid */}
                            <button
                                className="absolute top-5 right-6 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"
                                onClick={closeMobile}
                                aria-label="Close menu"
                            >
                                <X size={20} className="text-slate-500" />
                            </button>

                            <div className="space-y-1 mb-8">
                                {navLinks.map((link, i) => (
                                    <motion.div
                                        key={link.label}
                                        initial={{ opacity: 0, x: -12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05, duration: 0.2 }}
                                    >
                                        <Link
                                            href={link.href}
                                            className="flex items-center justify-between py-3.5 px-4 text-base font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
                                            onClick={closeMobile}
                                        >
                                            {link.label}
                                            <ArrowRight size={16} className="text-slate-300" />
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-100">
                                <Link
                                    href="/school-portal/login"
                                    className="flex items-center justify-center gap-2 w-full py-3.5 font-semibold text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                                    onClick={closeMobile}
                                >
                                    <School size={16} className="text-slate-400" />
                                    School Login
                                </Link>
                                <Link
                                    href="/login"
                                    className="flex items-center justify-center gap-2 w-full py-3.5 font-semibold text-sm text-white bg-slate-900 rounded-xl shadow-sm hover:bg-slate-800 transition-colors"
                                    onClick={closeMobile}
                                >
                                    Student Login
                                    <ArrowRight size={15} />
                                </Link>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
