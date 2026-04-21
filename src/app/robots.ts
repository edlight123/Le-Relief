import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site.config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/dashboard",
          "/api/",
          "/login",
          "/signup",
        ],
      },
    ],
    host: siteConfig.url,
    sitemap: [
      `${siteConfig.url}/sitemap.xml`,
      `${siteConfig.url}/sitemap-fr.xml`,
      `${siteConfig.url}/sitemap-en.xml`,
    ],
  };
}
