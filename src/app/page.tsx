import React from 'react';
import dynamicFn from 'next/dynamic';

export const dynamic = 'force-dynamic';

import { Navigation } from '@/components/landing/Navigation';
import { HeroSection } from '@/components/landing/HeroSection';
import { getPlatformSettings } from '@/components/landing/actions';

// Lazy load sections below the fold
const FeaturesSection = dynamicFn(() => import('@/components/landing/FeaturesSection').then(mod => mod.FeaturesSection), { ssr: true });
const DemoSection = dynamicFn(() => import('@/components/landing/DemoSection').then(mod => mod.DemoSection), { ssr: true });
const StatsSection = dynamicFn(() => import('@/components/landing/StatsSection').then(mod => mod.StatsSection), { ssr: true });
const TestimonialsSection = dynamicFn(() => import('@/components/landing/TestimonialsSection').then(mod => mod.TestimonialsSection), { ssr: true });
const PricingSection = dynamicFn(() => import('@/components/landing/PricingSection').then(mod => mod.PricingSection), { ssr: true });
const FAQSection = dynamicFn(() => import('@/components/landing/FAQSection').then(mod => mod.FAQSection), { ssr: true });
const CTASection = dynamicFn(() => import('@/components/landing/CTASection').then(mod => mod.CTASection), { ssr: true });
const Footer = dynamicFn(() => import('@/components/landing/Footer').then(mod => mod.Footer), { ssr: true });

export default async function Home() {
  const settings = await getPlatformSettings();

  return (
    <div className="min-h-screen bg-white text-slate-800 selection:bg-blue-500/30 selection:text-blue-900 font-roboto overflow-x-clip">

      {/* 1. Flat Navigation Bar */}
      <Navigation settings={settings} />

      {/* 2. Hero Section - Glassmorphism + Bold Minimalism (Over Light Gradient) */}
      <HeroSection settings={settings} />


      {/* 3. Features Section - Glassmorphism Bento Grid */}
      <FeaturesSection />

      {/* 4. Product Demo Section - Material Design */}
      <DemoSection settings={settings} />

      {/* 5. Statistics Section - Modern Impact */}
      <StatsSection />

      {/* 6. Social Proof / Testimonials - Modern Scrolling Grids */}
      <TestimonialsSection />

      {/* 7. Pricing Section - Neumorphism + Flat Hybrid */}
      <PricingSection />

      {/* 8. FAQ Section - Minimal Flat */}
      <FAQSection />

      {/* 9. Final CTA - Glassmorphism + Gradient Glow */}
      <CTASection />

      {/* 10. Footer - Dark Minimalism */}
      <Footer settings={settings} />

    </div>
  );
}
