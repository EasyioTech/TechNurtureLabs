'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

export const FooterDark = () => {
    return (
        <footer className="relative z-10 bg-slate-950 text-slate-400 pt-24 pb-12 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">

                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 relative z-10">
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-900">
                                <Sparkles size={16} />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-white">TechNurture</span>
                        </div>
                        <p className="text-sm leading-relaxed mb-6 font-medium">
                            Redefining K-12 education through world-class immersive learning experiences.
                        </p>
                    </div>

                    <div className="md:col-span-1">
                        <h4 className="text-white font-bold mb-6">Platform</h4>
                        <ul className="space-y-4">
                            <li><a href="#" className="hover:text-white text-sm transition-colors font-medium">Features</a></li>
                            <li><a href="#" className="hover:text-white text-sm transition-colors font-medium">Gamification</a></li>
                            <li><a href="#" className="hover:text-white text-sm transition-colors font-medium">Analytics</a></li>
                            <li><a href="#" className="hover:text-white text-sm transition-colors font-medium">Pricing</a></li>
                        </ul>
                    </div>

                    <div className="md:col-span-1">
                        <h4 className="text-white font-bold mb-6">Company</h4>
                        <ul className="space-y-4">
                            <li><a href="#" className="hover:text-white text-sm transition-colors font-medium">About Us</a></li>
                            <li><a href="#" className="hover:text-white text-sm transition-colors font-medium">Careers</a></li>
                            <li><a href="#" className="hover:text-white text-sm transition-colors font-medium">Blog</a></li>
                            <li><a href="#" className="hover:text-white text-sm transition-colors font-medium">Contact</a></li>
                        </ul>
                    </div>

                    <div className="md:col-span-1">
                        <h4 className="text-white font-bold mb-6">Legal</h4>
                        <ul className="space-y-4">
                            <li><a href="#" className="hover:text-white text-sm transition-colors font-medium">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-white text-sm transition-colors font-medium">Terms of Service</a></li>
                            <li><a href="#" className="hover:text-white text-sm transition-colors font-medium">Data Processing Addendum</a></li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-slate-800 text-sm relative z-10">
                    <p className="font-medium">© 2026 TechNurture Labs. All rights reserved.</p>
                    <div className="flex items-center gap-6 mt-4 md:mt-0">
                        <a href="#" className="hover:text-white transition-colors font-medium">Twitter</a>
                        <a href="#" className="hover:text-white transition-colors font-medium">LinkedIn</a>
                        <a href="#" className="hover:text-white transition-colors font-medium">Instagram</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
