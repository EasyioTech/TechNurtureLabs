import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — TechNurture Labs",
  description:
    "Read the TechNurture Labs Terms of Service. Understand our usage policies for schools, students, and administrators on the platform.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: "https://technurturelms.in/terms",
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
