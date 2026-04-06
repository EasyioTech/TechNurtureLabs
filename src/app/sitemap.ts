import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://technurturelms.in";
  const now = new Date();

  // Public pages that should be indexed
  const publicRoutes = [
    { path: "", priority: 1.0, changeFrequency: "daily" as const },
    { path: "/pricing", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/register/student", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/register/school", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/contact-us", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/terms", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/privacy-policy", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/refund-policy", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/shipping-policy", priority: 0.5, changeFrequency: "monthly" as const },
  ];

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
