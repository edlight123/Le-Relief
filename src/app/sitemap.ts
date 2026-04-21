import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site.config";
import * as articlesRepo from "@/lib/repositories/articles";
import * as categoriesRepo from "@/lib/repositories/categories";
import * as usersRepo from "@/lib/repositories/users";

const LOCALES = ["fr", "en"] as const;
const INDEXABLE_STATIC_PATHS = ["", "about", "categories", "contact", "corrections", "privacy", "traduction-ia"] as const;

type Locale = (typeof LOCALES)[number];

function toAbsolute(path: string) {
  return `${siteConfig.url}${path}`;
}

function buildAlternates(frPath: string, enPath: string) {
  return {
    languages: {
      fr: toAbsolute(frPath),
      en: toAbsolute(enPath),
      "x-default": toAbsolute(frPath),
    },
  };
}

function asDate(value: unknown) {
  if (!value) return new Date();
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = INDEXABLE_STATIC_PATHS.flatMap((path) =>
    LOCALES.map((locale) => {
      const route = path ? `/${locale}/${path}` : `/${locale}`;
      return {
        url: toAbsolute(route),
        lastModified: now,
        changeFrequency: path === "" ? "daily" : path === "categories" ? "monthly" : "monthly",
        priority: path === "" ? 1 : path === "categories" ? 0.7 : 0.5,
        alternates: buildAlternates(path ? `/fr/${path}` : "/fr", path ? `/en/${path}` : "/en"),
      } satisfies MetadataRoute.Sitemap[number];
    }),
  );

  let articleRoutes: MetadataRoute.Sitemap = [];
  try {
    const published = await articlesRepo.getPublishedArticles(1000);
    const frById = new Map(
      published
        .filter((article) => article.language !== "en" && typeof article.id === "string")
        .map((article) => [article.id as string, article]),
    );
    const enBySourceId = new Map(
      published
        .filter((article) => article.language === "en" && typeof article.sourceArticleId === "string")
        .map((article) => [article.sourceArticleId as string, article]),
    );

    articleRoutes = published
      .filter((article) => typeof article.slug === "string" && Boolean(article.slug))
      .map((article) => {
        const locale: Locale = article.language === "en" ? "en" : "fr";
        const currentPath = `/${locale}/articles/${article.slug as string}`;
        const frPath =
          locale === "fr"
            ? currentPath
            : article.sourceArticleId && frById.get(article.sourceArticleId as string)?.slug
              ? `/fr/articles/${String(frById.get(article.sourceArticleId as string)?.slug)}`
              : typeof article.alternateLanguageSlug === "string" && article.alternateLanguageSlug
                ? `/fr/articles/${article.alternateLanguageSlug}`
                : currentPath;
        const enCounterpart =
          locale === "fr"
            ? enBySourceId.get(article.id as string)
            : article;
        const enPath =
          locale === "en"
            ? currentPath
            : typeof enCounterpart?.slug === "string" && enCounterpart.slug
              ? `/en/articles/${enCounterpart.slug}`
              : typeof article.alternateLanguageSlug === "string" && article.alternateLanguageSlug
                ? `/en/articles/${article.alternateLanguageSlug}`
                : currentPath;

        return {
          url: toAbsolute(currentPath),
          lastModified: asDate(article.updatedAt || article.publishedAt),
          changeFrequency: "weekly",
          priority: article.featured ? 0.8 : 0.6,
          alternates: buildAlternates(frPath, enPath),
        } satisfies MetadataRoute.Sitemap[number];
      });
  } catch {
    articleRoutes = [];
  }

  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const categories = await categoriesRepo.getCategories();
    categoryRoutes = categories
      .filter((category) => typeof category.slug === "string" && Boolean(category.slug))
      .flatMap((category) =>
        LOCALES.map((locale) => ({
          url: toAbsolute(`/${locale}/categories/${category.slug as string}`),
          lastModified: asDate(category.updatedAt),
          changeFrequency: "monthly",
          priority: 0.6,
          alternates: buildAlternates(
            `/fr/categories/${category.slug as string}`,
            `/en/categories/${category.slug as string}`,
          ),
        } satisfies MetadataRoute.Sitemap[number])),
      );
  } catch {
    categoryRoutes = [];
  }

  let authorRoutes: MetadataRoute.Sitemap = [];
  try {
    const authors = await usersRepo.getUsers();
    authorRoutes = authors.flatMap((author) =>
      LOCALES.map((locale) => ({
        url: toAbsolute(`/${locale}/auteurs/${author.id as string}`),
        lastModified: asDate(author.updatedAt),
        changeFrequency: "weekly",
        priority: 0.4,
        alternates: buildAlternates(
          `/fr/auteurs/${author.id as string}`,
          `/en/auteurs/${author.id as string}`,
        ),
      } satisfies MetadataRoute.Sitemap[number])),
    );
  } catch {
    authorRoutes = [];
  }

  return [...staticRoutes, ...articleRoutes, ...categoryRoutes, ...authorRoutes];
}
