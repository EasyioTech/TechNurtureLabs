'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Sparkles, Menu, X, ArrowRight, GraduationCap, School, LogIn, UserCircle, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Demo', href: '#demo' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Reviews', href: '#testimonials' },
];

export const Navigation = ({ settings }: { settings?: any }) => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('');
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

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
                            <button
                                onClick={() => setIsLoginModalOpen(true)}
                                className="flex items-center gap-2 text-[13px] font-semibold text-white bg-slate-900 hover:bg-slate-800 px-6 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-[1px] active:translate-y-0"
                            >
                                <LogIn size={15} />
                                Login
                                <ArrowRight size={14} className="ml-0.5 opacity-60" />
                            </button>
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
                                <button
                                    onClick={() => {
                                        closeMobile();
                                        setIsLoginModalOpen(true);
                                    }}
                                    className="flex items-center justify-center gap-2 w-full py-3.5 font-semibold text-sm text-white bg-slate-900 rounded-xl shadow-sm hover:bg-slate-800 transition-colors"
                                >
                                    <LogIn size={16} />
                                    Login to Portal
                                    <ArrowRight size={15} />
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Login Selection Modal */}
            <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
                <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh]">
                    <div className="relative p-5 sm:p-8 pt-8 sm:pt-10">
                        <DialogHeader className="mb-6 sm:mb-8 text-center sm:text-center">
                            <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-900 flex items-center justify-center mb-3 sm:mb-4 shadow-lg">
                                <Sparkles className="text-white" size={20} />
                            </div>
                            <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 mb-1 sm:mb-2 leading-tight">Welcome Back</DialogTitle>
                            <DialogDescription className="text-slate-500 text-sm sm:text-base leading-snug px-2">
                                Select your portal to continue your learning journey
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-3 sm:gap-4">
                            <Link
                                href="/login"
                                onClick={() => setIsLoginModalOpen(false)}
                                className="group relative flex items-center gap-3 sm:gap-5 p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-300 shadow-sm hover:shadow-md"
                            >
                                <div className="w-11 h-11 sm:w-14 sm:h-14 shrink-0 rounded-lg sm:rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-105 sm:group-hover:scale-110 transition-transform duration-300">
                                    <GraduationCap size={22} className="sm:size-[28px]" />
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <h3 className="font-bold text-slate-900 text-base sm:text-lg group-hover:text-blue-700 transition-colors truncate">I am a Student</h3>
                                    <p className="text-slate-500 text-[12px] sm:text-sm line-clamp-1">Access your courses, tasks, and progress</p>
                                </div>
                                <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0" />
                            </Link>

                            <Link
                                href="/school-portal/login"
                                onClick={() => setIsLoginModalOpen(false)}
                                className="group relative flex items-center gap-3 sm:gap-5 p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all duration-300 shadow-sm hover:shadow-md"
                            >
                                <div className="w-11 h-11 sm:w-14 sm:h-14 shrink-0 rounded-lg sm:rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-105 sm:group-hover:scale-110 transition-transform duration-300">
                                    <School size={22} className="sm:size-[28px]" />
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <h3 className="font-bold text-slate-900 text-base sm:text-lg group-hover:text-indigo-700 transition-colors truncate">I am a Teacher</h3>
                                    <p className="text-slate-500 text-[12px] sm:text-sm line-clamp-1">Manage classrooms, students, and content</p>
                                </div>
                                <ArrowRight size={18} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all shrink-0" />
                            </Link>
                        </div>

                        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-50 text-center">
                            <p className="text-slate-400 text-[10px] sm:text-xs font-semibold uppercase tracking-widest">
                                Secure Access Powered by TechNurture
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
