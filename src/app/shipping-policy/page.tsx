'use client';

import React from 'react';
import { Navigation } from '@/components/landing/Navigation';
import { Footer } from '@/components/landing/Footer';

export default function ShippingPolicy() {
    return (
        <div className="min-h-screen bg-white text-slate-800 font-roboto">
            <Navigation />
            
            <main className="max-w-4xl mx-auto px-6 py-24 sm:py-32">
                <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-8 underline decoration-blue-500 decoration-4 underline-offset-8">
                    Shipping & Delivery Policy
                </h1>
                
                <div className="prose prose-slate prose-lg max-w-none space-y-8 text-slate-600 font-medium leading-relaxed">
                    <section>
                        <p className="text-sm uppercase tracking-widest font-black text-blue-600 mb-2">Effective Date: March 30, 2026</p>
                        <p>At TechNurture Labs, we provide digital services on a software-as-a-service (SaaS) model.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">1. Delivery of Services</h2>
                        <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Instant Access:</strong> Upon successful payment, your account will be activated instantly. You will receive a confirmation email with your account details.</li>
                        <li><strong>No Physical Shipping:</strong> We do not ship physical products; all our materials, courses, and platform features are accessible online.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">2. Support for Access Issues</h2>
                        <p>If you face any issues while accessing the platform after payment, please contact our support team at <a href="mailto:hello@technurture.com" className="text-blue-600 font-bold hover:underline">hello@technurture.com</a>. We will resolve your access issues within 24-48 hours.</p>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
