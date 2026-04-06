import type { Metadata } from 'next';
import { getPlatformSettings } from "@/components/landing/actions";

export const revalidate = 3600; // Cache for 1 hour for SEO

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPlatformSettings();
  const platformName = settings?.platform_name ?? "TechNurture Labs";

  return {
    title: `Pricing Plans — ${platformName} | Affordable LMS for Schools`,
    description: "View our flexible pricing plans for schools and students in India. Get started with TechNurture Labs LMS at affordable rates. Free trial available.",
    keywords: [
      "TechNurture pricing",
      "LMS pricing India",
      "school management system pricing",
      "online learning platform cost",
      "affordable LMS plans",
      "student learning platform pricing",
    ],
    alternates: {
      canonical: "https://technurturelms.in/pricing",
    },
    openGraph: {
      title: `Pricing Plans — ${platformName}`,
      description: "Flexible pricing plans for K-12 schools. Start free, scale as you grow.",
      url: "https://technurturelms.in/pricing",
      type: "website",
    },
  };
}

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "TechNurture Labs Pricing",
            description: "Pricing plans for TechNurture Labs LMS",
            url: "https://technurturelms.in/pricing",
          }),
        }}
      />
      {/* Redirect to pricing section - but page is now indexable with metadata */}
      <div style={{ display: 'none' }}>
        <h1>TechNurture Labs Pricing Plans</h1>
        <p>Flexible pricing for schools and students across India</p>
      </div>
    </>
  );
}
