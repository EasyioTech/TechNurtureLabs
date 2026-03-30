'use client';

import React from 'react';
import { Navigation } from '@/components/landing/Navigation';
import { Footer } from '@/components/landing/Footer';
import { Mail, MapPin, Phone, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ContactUs() {
    return (
        <div className="min-h-screen bg-white text-slate-800 font-roboto">
            <Navigation />
            
            <main className="max-w-7xl mx-auto px-6 py-24 sm:py-32">
                <div className="text-center mb-20">
                    <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 mb-6 underline decoration-blue-500 decoration-4 underline-offset-8">
                        Get in Touch
                    </h1>
                    <p className="text-xl font-medium text-slate-500 max-w-2xl mx-auto leading-relaxed">
                        Have questions about TechNurture Labs? We're here to help you revolutionize the learning experience for your school.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 relative">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -z-10 -translate-x-1/2 -translate-y-1/2" />
                    
                    <div className="space-y-12">
                        <section className="space-y-6">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <MessageSquare className="text-blue-600" size={28} strokeWidth={2.5} />
                                Contact Information
                            </h2>
                            <div className="space-y-6">
                                <div className="flex items-start gap-6 group">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                        <Mail size={20} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Email Address</p>
                                        <p className="text-lg font-bold text-slate-900">hello@technurture.com</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-6 group">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                        <Phone size={20} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Phone Number</p>
                                        <p className="text-lg font-bold text-slate-900">+91 9110196884</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-6 group">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                        <MapPin size={20} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Headquarters</p>
                                        <p className="text-lg font-bold text-slate-900 leading-relaxed">
                                            TechNurture Labs, Bangalore, Karnataka, India
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="p-8 rounded-[40px] bg-slate-900 text-white space-y-4 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
                            <h3 className="text-xl font-black tracking-tight relative z-10">Merchant Details</h3>
                            <div className="space-y-2 text-sm font-medium text-slate-400 relative z-10 leading-relaxed">
                                <p><strong>Legal Name:</strong> TechNurture Labs</p>
                                <p><strong>Type:</strong> Educational Technology Services</p>
                                <p>Official Merchant for Platform Subscriptions</p>
                            </div>
                        </section>
                    </div>

                    <div className="bg-white p-8 sm:p-12 rounded-[48px] border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/[0.03] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700" />
                        
                        <form className="space-y-8 relative z-10" onSubmit={(e) => e.preventDefault()}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">First Name</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold placeholder:text-slate-300"
                                        placeholder="John"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">Last Name</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold placeholder:text-slate-300"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">Email Address</label>
                                <input 
                                    type="email" 
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold placeholder:text-slate-300"
                                    placeholder="john@example.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-4">Message</label>
                                <textarea 
                                    rows={4}
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold placeholder:text-slate-300 resize-none"
                                    placeholder="Tell us how we can help..."
                                />
                            </div>

                            <Button className="w-full py-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-widest transition-all shadow-lg hover:shadow-blue-500/20 active:scale-95">
                                Send Message
                            </Button>
                        </form>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
