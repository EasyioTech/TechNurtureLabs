import React from 'react';
import dynamicFn from 'next/dynamic';
import type { Metadata } from 'next';
import Script from 'next/script';

export const dynamic = 'force-dynamic';

import { Navigation } from '@/components/landing/Navigation';
import { HeroSection } from '@/components/landing/HeroSection';
import { getPlatformSettings } from '@/components/landing/actions';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPlatformSettings();
  const platformName = settings?.platform_name ?? "TechNurture Labs";
  const siteUrl = "https://technurturelms.in";

  return {
    title: `${platformName} — LMS for Students | Online Learning Platform India`,
    description:
      "TechNurture Labs is an immersive LMS platform for schools and students across India. Get gamified skill-based courses in IoT, embedded systems, full-stack development, and more. UDISE-verified, mobile-first, built for K-12.",
    keywords: [
      "Technurture LMS",
      "LMS for students India",
      "online learning system India",
      "gamified learning platform",
      "IoT courses online India",
      "embedded systems learning",
      "full stack development courses",
      "Kashmir tech education",
      "LMS for Kashmir students",
      "digital education Kashmir",
      "skill-based LMS platform",
      "K-12 LMS India",
    ],
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      type: "website",
      url: siteUrl,
      title: `${platformName} — LMS for Students | Online Learning Platform India`,
      description:
        "Gamified courses, real-time analytics, and school-wide management for K-12 institutions in India. IoT, embedded systems, full-stack development, skill-based learning.",
    },
  };
}

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
      <Script
        id="ld-homepage"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "EducationalOrganization",
            "@id": "https://technurturelms.in/#edorg",
            name: "TechNurture Labs",
            url: "https://technurturelms.in",
            description:
              "TechNurture Labs is an immersive, gamified LMS platform for K-12 schools in India. Offering courses in IoT, embedded systems, full-stack web development, and technology skill-building for students.",
            logo: "https://technurturelms.in/api/branding/logo",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Bangalore",
              addressRegion: "Karnataka",
              addressCountry: "IN",
            },
            areaServed: [
              { "@type": "Country", name: "India" },
              { "@type": "State", name: "Jammu and Kashmir" },
              { "@type": "State", name: "Karnataka" },
            ],
            hasOfferCatalog: {
              "@type": "OfferCatalog",
              name: "TechNurture Course Catalog",
              itemListElement: [
                {
                  "@type": "Course",
                  name: "IoT and Embedded Systems",
                  description:
                    "Hands-on online courses in Internet of Things and embedded systems programming for students.",
                  provider: { "@id": "https://technurturelms.in/#organization" },
                },
                {
                  "@type": "Course",
                  name: "Full Stack Web Development",
                  description:
                    "Comprehensive full-stack development curriculum covering frontend, backend, and deployment.",
                  provider: { "@id": "https://technurturelms.in/#organization" },
                },
                {
                  "@type": "Course",
                  name: "Programming Fundamentals",
                  description:
                    "Skill-based programming courses for students in K-12 institutions across India.",
                  provider: { "@id": "https://technurturelms.in/#organization" },
                },
              ],
            },
          }),
        }}
      />

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
