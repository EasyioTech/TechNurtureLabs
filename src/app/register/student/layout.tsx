import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Registration — Join TechNurture Labs",
  description:
    "Create your free TechNurture Labs student account. Start learning IoT, embedded systems, full-stack development, and programming with gamified, skill-based courses.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: "https://technurturelms.in/register/student",
  },
  openGraph: {
    title: "Student Registration — Join TechNurture Labs",
    description:
      "Sign up for TechNurture Labs and start your learning journey in IoT, embedded systems, full-stack development, and programming.",
    url: "https://technurturelms.in/register/student",
    type: "website",
  },
};

export default function RegisterStudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
