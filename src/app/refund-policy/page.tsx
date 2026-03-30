'use client';

import React from 'react';
import { Navigation } from '@/components/landing/Navigation';
import { Footer } from '@/components/landing/Footer';

export default function RefundPolicy() {
    return (
        <div className="min-h-screen bg-white text-slate-800 font-roboto">
            <Navigation />
            
            <main className="max-w-4xl mx-auto px-6 py-24 sm:py-32">
                <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-8 underline decoration-blue-500 decoration-4 underline-offset-8">
                    Refund & Cancellation Policy
                </h1>
                
                <div className="prose prose-slate prose-lg max-w-none space-y-8 text-slate-600 font-medium leading-relaxed">
                    <section>
                        <p className="text-sm uppercase tracking-widest font-black text-blue-600 mb-2">Effective Date: March 30, 2026</p>
                        <p>At TechNurture Labs, we aim for total customer satisfaction. This policy outlines our procedures for refunds and cancellations.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">1. Subscription Cancellations</h2>
                        <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Monthly Subscriptions:</strong> Can be cancelled at any time; however, access will continue until the end of the current billing cycle. No partial refunds for mid-cycle cancellations.</li>
                        <li><strong>Annual Subscriptions:</strong> Can be cancelled at any time, but no refunds will be issued for the remaining months of the year.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">2. Refund Eligibility</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>New Subscriptions:</strong> We offer a 7-day money-back guarantee for initial subscriptions if you are not satisfied with our services.</li>
                            <li><strong>Duplicate Payments:</strong> If more than one payment is made for the same subscription accidentally, the additional amount will be refunded.</li>
                            <li><strong>Technical Errors:</strong> If our platform experiences major malfunctions that prevent use for over 48 hours, a pro-rated refund may result.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">3. How to Request a Refund</h2>
                        <p>To request a refund, please email us at <a href="mailto:hello@technurture.com" className="text-blue-600 font-bold hover:underline">hello@technurture.com</a> with your account details, payment receipt, and reason for the request. We will review and process your request within 7-10 working days.</p>
                    </section>

                    <section className="space-y-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight mb-2">Note:</h2>
                        <p className="text-sm">Refunds are issued back to the original payment method used through Razorpay. Processing times by your bank may vary.</p>
                    </section>

                    <section className="space-y-4 pt-8 border-t border-slate-100">
                        <p>If you have any questions about this Policy, please contact us at <a href="mailto:hello@technurture.com" className="text-blue-600 font-bold hover:underline">hello@technurture.com</a>.</p>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
