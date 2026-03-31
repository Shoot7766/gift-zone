import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin", "/provider", "/dashboard"],
    },
    sitemap: "https://sovga.uz/sitemap.xml",
  };
}
