import type { Metadata } from "next";
export const dynamic = 'force-dynamic';
import { getPlatformSettings } from "@/components/landing/actions";
import "./globals.css";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";

import { AuthProvider } from "@/components/providers/auth-provider";
import { BackgroundUploadManager } from "@/components/shared/background-upload-manager";
import { Toaster } from 'sonner';
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPlatformSettings();
  const platformName = settings?.platform_name ?? "TechNurture Labs";
  const siteUrl = "https://technurturelms.in";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${platformName} — LMS for Students | Online Learning Platform India`,
      template: `%s | ${platformName}`,
    },
    description:
      "TechNurture Labs is an immersive LMS platform built for K-12 schools and students across India. Gamified courses, real-time analytics, IoT, embedded systems, full-stack development and skill-based learning — all in one platform.",
    keywords: [
      "Technurture LMS",
      "Technurture Learning Platform",
      "technurturelms.in",
      "LMS for students",
      "online learning system India",
      "student management system",
      "IoT courses online",
      "embedded systems learning",
      "full stack development courses",
      "programming courses for students",
      "skill-based LMS platform",
      "course management system",
      "Kashmir tech education",
      "online courses in Kashmir",
      "LMS for Kashmir students",
      "tech learning platform Kashmir",
      "digital education Kashmir",
    ],
    authors: [{ name: "TechNurture Labs", url: siteUrl }],
    creator: "TechNurture Labs",
    publisher: "TechNurture Labs",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: siteUrl,
      siteName: `${platformName} — Immersive Learning Platform`,
      title: `${platformName} — LMS for Students | Online Learning Platform India`,
      description:
        "Gamified courses, real-time analytics, and school-wide management built for K-12 institutions across India. IoT, embedded systems, full-stack development courses available.",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${platformName} — Immersive Learning Platform`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${platformName} — LMS for Students | Online Learning Platform India`,
      description:
        "Gamified courses, real-time analytics, and school-wide management for K-12 schools in India.",
      images: ["/opengraph-image"],
      creator: "@technurturelabs",
      site: "@technurturelabs",
    },
    alternates: {
      canonical: siteUrl,
    },
    icons: {
      icon: "/api/branding/favicon",
      shortcut: "/api/branding/favicon",
      apple: "/api/branding/favicon",
    },
    category: "education",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
        <Script
          id="ld-org-website"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://technurturelms.in/#organization",
                  name: "TechNurture Labs",
                  url: "https://technurturelms.in",
                  logo: {
                    "@type": "ImageObject",
                    url: "https://technurturelms.in/api/branding/logo",
                    width: 200,
                    height: 60,
                  },
                  description:
                    "TechNurture Labs is an immersive LMS platform for K-12 schools across India, offering gamified courses, real-time analytics, IoT, embedded systems, and full-stack development programs.",
                  foundingLocation: {
                    "@type": "Place",
                    name: "Bangalore, Karnataka, India",
                    addressCountry: "IN",
                  },
                  contactPoint: [
                    {
                      "@type": "ContactPoint",
                      telephone: "+91-9110196884",
                      contactType: "customer support",
                      email: "hello@technurture.com",
                      availableLanguage: ["English", "Hindi"],
                      areaServed: "IN",
                    },
                  ],
                  address: {
                    "@type": "PostalAddress",
                    addressLocality: "Bangalore",
                    addressRegion: "Karnataka",
                    addressCountry: "IN",
                  },
                  sameAs: [
                    "https://twitter.com/technurturelabs",
                    "https://www.linkedin.com/company/technurturelabs",
                    "https://www.instagram.com/technurturelabs",
                  ],
                },
                {
                  "@type": "WebSite",
                  "@id": "https://technurturelms.in/#website",
                  url: "https://technurturelms.in",
                  name: "TechNurture Labs",
                  description:
                    "Immersive LMS platform for K-12 schools and students across India.",
                  publisher: {
                    "@id": "https://technurturelms.in/#organization",
                  },
                  potentialAction: {
                    "@type": "SearchAction",
                    target: {
                      "@type": "EntryPoint",
                      urlTemplate:
                        "https://technurturelms.in/search?q={search_term_string}",
                    },
                    "query-input": "required name=search_term_string",
                  },
                  inLanguage: "en-IN",
                },
              ],
            }),
          }}
        />
      </head>
      <body className="antialiased font-sans">
        <Toaster position="top-center" expand={true} richColors closeButton />
        <AuthProvider>
          <ErrorReporter />
          <BackgroundUploadManager />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
