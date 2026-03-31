import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy — TechNurture Labs",
  description:
    "TechNurture Labs Refund Policy for school and institutional subscriptions. Understand our cancellation and refund process.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: "https://technurturelms.in/refund-policy",
  },
};

export default function RefundPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
