import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us — TechNurture Labs",
  description:
    "Get in touch with TechNurture Labs. Contact our team for LMS onboarding, support, pricing, or general enquiries. Email: hello@technurture.com | Phone: +91 9110196884",
  alternates: {
    canonical: "https://technurturelms.in/contact-us",
  },
  openGraph: {
    title: "Contact Us — TechNurture Labs",
    description:
      "Reach the TechNurture Labs team. We help schools and students get started with gamified learning.",
    url: "https://technurturelms.in/contact-us",
    type: "website",
  },
};

export default function ContactUsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
