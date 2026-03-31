import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — TechNurture Labs",
  description:
    "TechNurture Labs Privacy Policy. We are committed to protecting student data with enterprise-grade encryption and full compliance with national data privacy regulations for minors.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: "https://technurturelms.in/privacy-policy",
  },
};

export default function PrivacyPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
