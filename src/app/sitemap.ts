import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site.config";
import * as articlesRepo from "@/lib/repositories/articles";
import * as categoriesRepo from "@/lib/repositories/categories";
import * as usersRepo from "@/lib/repositories/users";

// With cookie-based locale detection, all public URLs are clean (no /fr/ or /en/ prefix).
// Articles in different languages have different slugs, so each gets its own sitemap entry.
const INDEXABLE_STATIC_PATHS = ["", "about", "categories", "contact", "corrections", "privacy", "traduction-ia"] as const;

function toAbsolute(path: string) {
  return `${siteConfig.url}${path}`;
}

function asDate(value: unknown) {
  if (!value) return new Date();
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = INDEXABLE_STATIC_PATHS.map((path) => ({
    url: toAbsolute(path ? `/${path}` : "/"),
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "monthly",
    priority: path === "" ? 1 : path === "categories" ? 0.7 : 0.5,
  } satisfies MetadataRoute.Sitemap[number]));

  let articleRoutes: MetadataRoute.Sitemap = [];
  try {
    const published = await articlesRepo.getPublishedArticles(1000);
    articleRoutes = published
      .filter((article) => typeof article.slug === "string" && Boolean(article.slug))
      .map((article) => ({
        url: toAbsolute(`/articles/${article.slug as string}`),
        lastModified: asDate(article.updatedAt || article.publishedAt),
        changeFrequency: "weekly",
        priority: article.featured ? 0.8 : 0.6,
      } satisfies MetadataRoute.Sitemap[number]));
  } catch {
    articleRoutes = [];
  }

  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const categories = await categoriesRepo.getCategories();
    categoryRoutes = categories
      .filter((category) => typeof category.slug === "string" && Boolean(category.slug))
      .map((category) => ({
        url: toAbsolute(`/categories/${category.slug as string}`),
        lastModified: asDate(category.updatedAt),
        changeFrequency: "monthly",
        priority: 0.6,
      } satisfies MetadataRoute.Sitemap[number]));
  } catch {
    categoryRoutes = [];
  }

  let authorRoutes: MetadataRoute.Sitemap = [];
  try {
    const authors = await usersRepo.getUsers();
    authorRoutes = authors.map((author) => ({
      url: toAbsolute(`/auteurs/${author.id as string}`),
      lastModified: asDate(author.updatedAt),
      changeFrequency: "weekly",
      priority: 0.4,
    } satisfies MetadataRoute.Sitemap[number]));
  } catch {
    authorRoutes = [];
  }

  return [...staticRoutes, ...articleRoutes, ...categoryRoutes, ...authorRoutes];
}
