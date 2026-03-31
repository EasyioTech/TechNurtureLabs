import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Login — TechNurture Labs",
  description:
    "Sign in to your TechNurture Labs student account. Access gamified courses, track your learning progress, and continue your journey in IoT, embedded systems, and programming.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: "https://technurturelms.in/login",
  },
  openGraph: {
    title: "Student Login — TechNurture Labs",
    description:
      "Access your TechNurture Labs learning portal. Gamified courses, real-time progress tracking, and skill-based learning for students.",
    url: "https://technurturelms.in/login",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Student Login — TechNurture Labs",
    description:
      "Access your TechNurture Labs learning portal.",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
