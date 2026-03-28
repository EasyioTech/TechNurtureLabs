import React from 'react';
export const dynamic = 'force-dynamic';
import { Navigation } from '@/components/landing/Navigation';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { DemoSection } from '@/components/landing/DemoSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { StatsSection } from '@/components/landing/StatsSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { CTASection } from '@/components/landing/CTASection';
import { Footer } from '@/components/landing/Footer';
import { getPlatformSettings } from '@/components/landing/actions';

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
      <DemoSection />

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
