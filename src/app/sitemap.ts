import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site.config";
import * as articlesRepo from "@/lib/repositories/articles";
import * as categoriesRepo from "@/lib/repositories/categories";
import * as usersRepo from "@/lib/repositories/users";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = ["fr", "en"] as const;
  const staticRoutes: MetadataRoute.Sitemap = [
    ...locales.map((locale) => `/${locale}`),
    ...locales.flatMap((locale) => [
      `/${locale}/about`,
      `/${locale}/categories`,
      `/${locale}/contact`,
      `/${locale}/corrections`,
      `/${locale}/privacy`,
      `/${locale}/search`,
      `/${locale}/traduction-ia`,
      `/${locale}/login`,
      `/${locale}/signup`,
    ]),
  ].map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "/fr" || route === "/en" ? "daily" : "weekly",
    priority: route === "/fr" || route === "/en" ? 1 : 0.7,
  }));

  let articleRoutes: MetadataRoute.Sitemap = [];
  try {
    const published = await articlesRepo.getPublishedArticles(500);
    const routeMap = new Map<string, MetadataRoute.Sitemap[number]>();
    for (const article of published) {
      const language = article.language === "en" ? "en" : "fr";
      const slug = article.slug as string | undefined;
      if (!slug) continue;

      const routes = [
        `/${language}/articles/${slug}`,
      ];

      if (typeof article.alternateLanguageSlug === "string" && article.alternateLanguageSlug) {
        routes.push(`/${language === "fr" ? "en" : "fr"}/articles/${article.alternateLanguageSlug}`);
      }

      for (const route of routes) {
        routeMap.set(route, {
          url: `${siteConfig.url}${route}`,
          lastModified: new Date((article.updatedAt as string) || Date.now()),
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    }
    articleRoutes = [...routeMap.values()];
  } catch {
    articleRoutes = [];
  }

  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const categories = await categoriesRepo.getCategories();
    categoryRoutes = categories
      .filter((cat) => cat.slug)
      .flatMap((cat) =>
        locales.map((locale) => ({
          url: `${siteConfig.url}/${locale}/categories/${cat.slug as string}`,
          lastModified: new Date(),
          changeFrequency: "daily",
          priority: 0.7,
        })),
      );
  } catch {
    categoryRoutes = [];
  }

  let authorRoutes: MetadataRoute.Sitemap = [];
  try {
    const authors = await usersRepo.getUsers();
    authorRoutes = authors.flatMap((author) =>
      locales.map((locale) => ({
        url: `${siteConfig.url}/${locale}/auteurs/${author.id as string}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
      })),
    );
  } catch {
    authorRoutes = [];
  }

  return [...staticRoutes, ...articleRoutes, ...categoryRoutes, ...authorRoutes];
}
