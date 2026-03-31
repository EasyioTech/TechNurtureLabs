import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register Your School — TechNurture Labs LMS",
  description:
    "Onboard your K-12 school to TechNurture Labs in under 24 hours. UDISE-verified, white-label LMS with gamified courses, analytics, and student management for schools across India.",
  keywords: [
    "LMS for schools India",
    "K-12 LMS platform",
    "school management system",
    "UDISE verified LMS",
    "register school online India",
    "Kashmir school LMS",
  ],
  robots: { index: true, follow: true },
  alternates: {
    canonical: "https://technurturelms.in/register/school",
  },
  openGraph: {
    title: "Register Your School — TechNurture Labs LMS",
    description:
      "Onboard your K-12 school to TechNurture Labs. Gamified courses, analytics, and student management — all in one platform.",
    url: "https://technurturelms.in/register/school",
    type: "website",
  },
};

export default function RegisterSchoolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
