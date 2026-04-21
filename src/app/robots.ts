import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site.config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/fr/", "/en/"],
      disallow: ["/dashboard", "/api/"],
    },
    sitemap: [
      `${siteConfig.url}/sitemap.xml`,
      `${siteConfig.url}/sitemap-fr.xml`,
      `${siteConfig.url}/sitemap-en.xml`,
    ],
  };
}
