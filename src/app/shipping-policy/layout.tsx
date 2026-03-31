import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping Policy — TechNurture Labs",
  description:
    "TechNurture Labs Shipping Policy. As a digital-first LMS platform, all products and services are delivered electronically.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: "https://technurturelms.in/shipping-policy",
  },
};

export default function ShippingPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
