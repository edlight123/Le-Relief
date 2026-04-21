import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site.config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/fr/", "/en/", "/sitemap.xml", "/sitemap-fr.xml", "/sitemap-en.xml"],
        disallow: [
          "/dashboard",
          "/api/",
          "/fr/login",
          "/en/login",
          "/fr/signup",
          "/en/signup",
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
