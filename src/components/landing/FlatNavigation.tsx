'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ChevronDown, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export const FlatNavigation = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={cn(
            "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
            scrolled ? "bg-white/90 backdrop-blur-lg border-slate-200 py-3 shadow-sm" : "bg-white border-transparent py-5"
        )}>
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between">

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center transition-transform group-hover:scale-105">
                            <Sparkles className="text-white" size={16} />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900">TechNurture</span>
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">Features</a>
                        <a href="#testimonials" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">Testimonials</a>
                        <a href="#stats" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">Impact</a>
                        <a href="#pricing" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">Pricing</a>
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-3">
                        <Link href="/school-portal/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                            School Login
                        </Link>
                        <Link href="/login" className="text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 px-5 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md hover:-translate-y-px cursor-pointer">
                            Student Login
                        </Link>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2 text-slate-600"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-xl px-6 py-4 flex flex-col gap-4"
                >
                    <a href="#features" className="text-base font-semibold text-slate-800" onClick={() => setMobileMenuOpen(false)}>Features</a>
                    <a href="#testimonials" className="text-base font-semibold text-slate-800" onClick={() => setMobileMenuOpen(false)}>Testimonials</a>
                    <a href="#stats" className="text-base font-semibold text-slate-800" onClick={() => setMobileMenuOpen(false)}>Impact</a>
                    <a href="#pricing" className="text-base font-semibold text-slate-800" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
                    <hr className="border-slate-100" />
                    <div className="flex flex-col gap-3">
                        <Link href="/school-portal/login" className="w-full text-center py-3 font-semibold text-slate-700 bg-slate-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>School Login</Link>
                        <Link href="/login" className="w-full text-center py-3 font-semibold text-white bg-slate-900 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Student Login</Link>
                    </div>
                </motion.div>
            )}
        </nav>
    );
};
