import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/admin-portal/",
          "/school-portal/",
          "/student/",
          "/school-admin/",
        ],
      },
    ],
    sitemap: "https://technurturelms.in/sitemap.xml",
    host: "https://technurturelms.in",
  };
}
