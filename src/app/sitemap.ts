import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://technurturelms.in";
  const now = new Date();

  const routes = [
    "",
    "/login",
    "/register/student",
    "/register/school",
    "/contact-us",
    "/pricing",
    "/terms",
    "/privacy-policy",
    "/refund-policy",
    "/shipping-policy",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1.0 : route.startsWith("/register") ? 0.9 : 0.7,
  }));
}
