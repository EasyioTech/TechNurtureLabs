'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowUpRight, Mail, MapPin } from 'lucide-react';

const footerLinks = {
    platform: [
        { label: 'Features', href: '#features' },
        { label: 'Product Demo', href: '#demo' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'Reviews', href: '#testimonials' },
    ],
    company: [
        { label: 'Register School', href: '/register/school' },
        { label: 'Student Login', href: '/login' },
        { label: 'School Portal', href: '/school-portal/login' },
        { label: 'Contact Us', href: 'mailto:hello@technurture.com' },
    ],
    legal: [
        { label: 'Privacy Policy', href: '#' },
        { label: 'Terms of Service', href: '#' },
        { label: 'Data Processing', href: '#' },
        { label: 'Cookie Policy', href: '#' },
    ],
};

export const Footer = ({ settings }: { settings?: any }) => {
    return (
        <footer className="relative z-10 bg-slate-50 text-slate-500 overflow-hidden">

            {/* Top divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

            {/* Subtle ambient background */}
            <div className="absolute inset-0 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                    }}
                />
                <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[140px]" />
                <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] bg-indigo-100/30 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">

                {/* Main Footer Content */}
                <div className="pt-20 pb-16">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">

                        {/* Brand Column */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="flex items-center gap-3">
                                {settings?.logo_url ? (
                                    <div
                                        className="flex items-center justify-center"
                                        style={{ height: settings?.logo_height ? `${settings.logo_height}px` : '32px' }}
                                    >
                                        <img
                                            src={settings.logo_url}
                                            alt="Platform Logo"
                                            className="w-auto h-full object-contain"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-sm">
                                        <Sparkles size={16} />
                                    </div>
                                )}
                                {settings?.show_platform_name !== false && (
                                    <span className="text-xl font-black tracking-tight text-slate-900">
                                        {settings?.platform_name || 'TechNurture'}
                                    </span>
                                )}
                            </div>

                            <p className="text-sm leading-relaxed font-medium text-slate-400 max-w-sm">
                                Redefining K-12 education through world-class immersive learning experiences — making knowledge acquisition engaging, personalized, and measurable.
                            </p>

                            {/* Contact info */}
                            <div className="space-y-3 pt-2">
                                <a href="mailto:hello@technurture.com" className="flex items-center gap-3 text-sm font-medium text-slate-400 hover:text-blue-600 transition-colors group">
                                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center group-hover:border-blue-200 group-hover:bg-blue-50 transition-all shadow-sm">
                                        <Mail size={14} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                    hello@technurture.com
                                </a>
                                <div className="flex items-center gap-3 text-sm font-medium text-slate-400">
                                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                        <MapPin size={14} />
                                    </div>
                                    India
                                </div>
                            </div>
                        </div>

                        {/* Links Columns */}
                        <div className="lg:col-span-8">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 lg:gap-12">
                                {Object.entries(footerLinks).map(([category, links]) => (
                                    <div key={category}>
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 mb-5">
                                            {category}
                                        </h4>
                                        <ul className="space-y-3.5">
                                            {links.map((link) => (
                                                <li key={link.label}>
                                                    <Link
                                                        href={link.href}
                                                        className="group flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-blue-600 transition-colors"
                                                    >
                                                        {link.label}
                                                        <ArrowUpRight
                                                            size={12}
                                                            className="opacity-0 -translate-y-0.5 group-hover:opacity-60 group-hover:translate-y-0 transition-all"
                                                        />
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-slate-200 py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-xs font-medium text-slate-400 tracking-wide">
                            © {new Date().getFullYear()} {settings?.platform_name || 'TechNurture'}. All rights reserved.
                        </p>

                        {/* Social Links */}
                        <div className="flex items-center gap-1">
                            {['Twitter', 'LinkedIn', 'Instagram', 'YouTube'].map((social) => (
                                <a
                                    key={social}
                                    href="#"
                                    className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-blue-600 rounded-lg hover:bg-white transition-all"
                                >
                                    {social}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
