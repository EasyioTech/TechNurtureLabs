'use client';

import React from 'react';
import { Navigation } from '@/components/landing/Navigation';
import { Footer } from '@/components/landing/Footer';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-white text-slate-800 font-roboto">
            <Navigation />
            
            <main className="max-w-4xl mx-auto px-6 py-24 sm:py-32">
                <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-8 underline decoration-blue-500 decoration-4 underline-offset-8">
                    Privacy Policy
                </h1>
                
                <div className="prose prose-slate prose-lg max-w-none space-y-8 text-slate-600 font-medium leading-relaxed">
                    <section>
                        <p className="text-sm uppercase tracking-widest font-black text-blue-600 mb-2">Effective Date: March 30, 2026</p>
                        <p>At TechNurture Labs, we take your privacy seriously. This Privacy Policy describes how we collect, use, and share your personal information when you use our platform.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">1. Information We Collect</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Account Information:</strong> Name, email address, password, and contact details.</li>
                            <li><strong>Session Information:</strong> IP address, device type, browser type, and activity on the platform.</li>
                            <li><strong>Academic Data:</strong> Student progress, assignment submissions, quiz results, and XP earned.</li>
                            <li><strong>Payment Information:</strong> We do not store credit card details; all payments are processed securely via Razorpay.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">2. How We Use Your Information</h2>
                        <p>We use the collected information for the following purposes:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>To provide, maintain, and improve our services.</li>
                            <li>To process payments and manage your subscriptions.</li>
                            <li>To personalize user experience and provide tailored learning materials.</li>
                            <li>To communicate with you regarding updates, promotions, and support.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">3. Sharing of Information</h2>
                        <p>We do not sell your personal information to third parties. We may share information with:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Service Providers:</strong> For payment processing (Razorpay), email delivery (Postmark), and storage (R2).</li>
                            <li><strong>Educational Institutions:</strong> Information shared between students and their respective schools.</li>
                            <li><strong>Legal Obligations:</strong> If required by law or in response to a court order.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">4. Data Security</h2>
                        <p>We implement industry-standard security measures to protect your data from unauthorized access, disclosure, or alteration.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">5. Your Rights</h2>
                        <p>You have the right to access, correct, or delete your personal information. If you'd like to exercise these rights, please contact us.</p>
                    </section>

                    <section className="space-y-4 pt-8 border-t border-slate-100">
                        <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:hello@technurture.com" className="text-blue-600 font-bold hover:underline">hello@technurture.com</a>.</p>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
