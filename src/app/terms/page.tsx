'use client';

import React from 'react';
import { Navigation } from '@/components/landing/Navigation';
import { Footer } from '@/components/landing/Footer';

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-white text-slate-800 font-roboto">
            <Navigation />
            
            <main className="max-w-4xl mx-auto px-6 py-24 sm:py-32">
                <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-8 underline decoration-blue-500 decoration-4 underline-offset-8">
                    Terms & Conditions
                </h1>
                
                <div className="prose prose-slate prose-lg max-w-none space-y-8 text-slate-600 font-medium leading-relaxed">
                    <section>
                        <p className="text-sm uppercase tracking-widest font-black text-blue-600 mb-2">Effective Date: March 30, 2026</p>
                        <p>Welcome to TechNurture Labs. These Terms and Conditions govern your use of our LMS platform and services. By accessing or using our platform, you agree to be bound by these terms.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">1. Use of Services</h2>
                        <p>TechNurture Labs provides a Learning Management System (LMS) for schools and students. You agree to use the services only for lawful purposes and in accordance with these Terms.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">2. User Accounts</h2>
                        <p>To use our platform, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">3. Payments and Subscriptions</h2>
                        <p>Access to certain features of our platform requires payment of fees. All payments are processed securely through our payment partners (Razorpay). By subscribing to our services, you agree to pay all applicable fees and taxes.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">4. Intellectual Property</h2>
                        <p>All content on the TechNurture Labs platform, including text, graphics, logos, and software, is the property of TechNurture Labs or its content suppliers and is protected by intellectual property laws.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">5. Limitation of Liability</h2>
                        <p>TechNurture Labs shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use our services.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">6. Governing Law</h2>
                        <p>These terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law principles.</p>
                    </section>

                    <section className="space-y-4 pt-8 border-t border-slate-100">
                        <p>If you have any questions about these Terms, please contact us at <a href="mailto:hello@technurture.com" className="text-blue-600 font-bold hover:underline">hello@technurture.com</a>.</p>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
