import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site.config";
import * as articlesRepo from "@/lib/repositories/articles";
import * as categoriesRepo from "@/lib/repositories/categories";
import * as usersRepo from "@/lib/repositories/users";

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

  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const categories = await categoriesRepo.getCategories();
    categoryRoutes = categories
      .filter((cat) => cat.slug)
      .map((cat) => ({
        url: `${siteConfig.url}/categories/${cat.slug as string}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.7,
      }));
  } catch {
    categoryRoutes = [];
  }

  let authorRoutes: MetadataRoute.Sitemap = [];
  try {
    const authors = await usersRepo.getUsers();
    authorRoutes = authors.map((author) => ({
      url: `${siteConfig.url}/auteurs/${author.id as string}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch {
    authorRoutes = [];
  }

  return [...staticRoutes, ...articleRoutes, ...categoryRoutes, ...authorRoutes];
}
