import React from 'react';
import { FlatNavigation } from '@/components/landing/FlatNavigation';
import { HeroSectionLight } from '@/components/landing/HeroSectionLight';
import { FeaturesBentoLight } from '@/components/landing/FeaturesBentoLight';
import { DemoMaterial } from '@/components/landing/DemoMaterial';
import { TestimonialsModern } from '@/components/landing/TestimonialsModern';
import { StatsModern } from '@/components/landing/StatsModern';
import { PricingHybrid } from '@/components/landing/PricingHybrid';
import { FAQFlat } from '@/components/landing/FAQFlat';
import { CTAGlassmorphism } from '@/components/landing/CTAGlassmorphism';
import { FooterDark } from '@/components/landing/FooterDark';

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-800 selection:bg-blue-500/30 selection:text-blue-900 font-roboto overflow-x-hidden">

      {/* 1. Flat Navigation Bar */}
      <FlatNavigation />

      {/* 2. Hero Section - Glassmorphism + Bold Minimalism (Over Light Gradient) */}
      <HeroSectionLight />

      {/* 3. Features Section - Glassmorphism Bento Grid */}
      <FeaturesBentoLight />

      {/* 4. Product Demo Section - Material Design */}
      <DemoMaterial />

      {/* 5. Statistics Section - Modern Impact */}
      <StatsModern />

      {/* 6. Social Proof / Testimonials - Modern Scrolling Grids */}
      <TestimonialsModern />

      {/* 7. Pricing Section - Neumorphism + Flat Hybrid */}
      <PricingHybrid />

      {/* 8. FAQ Section - Minimal Flat */}
      <FAQFlat />

      {/* 9. Final CTA - Glassmorphism + Gradient Glow */}
      <CTAGlassmorphism />

      {/* 10. Footer - Dark Minimalism */}
      <FooterDark />

    </div>
  );
}
