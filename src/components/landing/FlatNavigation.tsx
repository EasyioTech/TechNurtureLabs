'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Menu, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export const FlatNavigation = ({ settings }: { settings?: any }) => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { label: 'Curriculum', href: '#features' },
        { label: 'Solutions', href: '#solutions' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'About', href: '#about' }
    ];

    return (
        <nav className={cn(
            "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
            scrolled
                ? "bg-white/80 backdrop-blur-xl border-b border-slate-200 py-3 shadow-sm"
                : "bg-transparent border-b border-transparent py-5"
        )}>
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between">

                    {/* Logo Area */}
                    <Link href="/" className="flex items-center gap-2.5 group">
                        {settings?.logo_url ? (
                            <img
                                src={settings.logo_url}
                                alt="Logo"
                                className="h-8 w-auto object-contain"
                                style={{ height: settings?.logo_height ? `${settings.logo_height}px` : '32px' }}
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center group-hover:scale-105 transition-transform">
                                <Sparkles className="text-white" size={16} />
                            </div>
                        )}
                        {settings?.show_platform_name !== false && (
                            <span className="text-xl font-black text-slate-900 tracking-tight">
                                {settings?.platform_name || 'TechNurture'}
                            </span>
                        )}
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center gap-10">
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="text-[13px] font-bold text-slate-500 hover:text-blue-600 transition-colors tracking-wide uppercase"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link href="/school-portal/login" className="text-[13px] font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-widest px-4 py-2 border border-slate-200 rounded-lg bg-white/50 hover:bg-white shadow-sm">
                            School Login
                        </Link>
                        <Link href="/login" className="text-[13px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-6 py-2.5 rounded-lg transition-all shadow-md hover:shadow-blue-100 hover:-translate-y-0.5 uppercase tracking-widest">
                            Student Login
                        </Link>
                    </div>

                    {/* Mobile Toggle */}
                    <button
                        className="md:hidden p-2 text-slate-600"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-xl overflow-hidden px-6 pb-8 pt-4 flex flex-col gap-6"
                    >
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="text-base font-bold text-slate-700 uppercase tracking-widest"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="flex flex-col gap-3 pt-2">
                            <Link
                                href="/school-portal/login"
                                className="w-full text-center py-4 font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl uppercase tracking-widest text-xs"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Platform Login
                            </Link>
                            <Link
                                href="/login"
                                className="w-full text-center py-4 font-bold text-white bg-blue-600 rounded-xl shadow-lg uppercase tracking-widest text-xs"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Get Started
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};
