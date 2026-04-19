import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site.config";
import * as articlesRepo from "@/lib/repositories/articles";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/about",
    "/categories",
    "/contact",
    "/corrections",
    "/en",
    "/politique-editoriale",
    "/privacy",
    "/search",
    "/traduction-ia",
    "/login",
    "/signup",
  ].map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));

  let articleRoutes: MetadataRoute.Sitemap = [];
  try {
    const published = await articlesRepo.getPublishedArticles(500);
    articleRoutes = published
      .filter((article) => article.slug)
      .map((article) => ({
        url: `${siteConfig.url}/articles/${article.slug as string}`,
        lastModified: new Date((article.updatedAt as string) || Date.now()),
        changeFrequency: "weekly",
        priority: 0.8,
      }));
  } catch {
    articleRoutes = [];
  }

  return [...staticRoutes, ...articleRoutes];
}
