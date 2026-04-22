import * as articlesRepo from "@/lib/repositories/articles";
import * as categoriesRepo from "@/lib/repositories/categories";
import * as homepageRepo from "@/lib/repositories/homepage";
import * as usersRepo from "@/lib/repositories/users";
import {
  type EditorialLanguage,
  type PublicArticle,
  type PublicCategory,
  normalizeArticle,
  normalizeCategory,
  sortCategories,
} from "@/lib/editorial";
import type { HomepageSettings } from "@/types/homepage";

export interface HomepageContent {
  hero: PublicArticle | null;
  secondary: PublicArticle[];
  latest: PublicArticle[];
  editorial: PublicArticle[];
  mostRead: PublicArticle[];
  categories: PublicCategory[];
  englishSelection: PublicArticle[];
  showNewsletter: boolean;
}

async function hydrateArticle(
  article: Record<string, unknown>,
): Promise<PublicArticle> {
  const [author, category] = await Promise.all([
    article.authorId ? usersRepo.getUser(article.authorId as string) : null,
    article.categoryId
      ? categoriesRepo.getCategory(article.categoryId as string)
      : null,
  ]);

  return normalizeArticle(article, author, category);
}

async function hydrateArticles(articles: Record<string, unknown>[]) {
  return Promise.all(articles.map((article) => hydrateArticle(article)));
}

async function hydratePublishedArticleById(id: string) {
  const article = await articlesRepo.getArticle(id);
  if (!article || article.status !== "published") return null;
  return hydrateArticle(article);
}

function uniqueById(articles: PublicArticle[]) {
  const seen = new Set<string>();
  return articles.filter((article) => {
    if (seen.has(article.id)) return false;
    seen.add(article.id);
    return true;
  });
}

function excludeIds(articles: PublicArticle[], ids: Set<string>) {
  return articles.filter((article) => !ids.has(article.id));
}

function orderByIds<T extends { id: string }>(items: T[], ids: string[]) {
  const itemMap = new Map(items.map((item) => [item.id, item]));
  return ids
    .map((id) => itemMap.get(id))
    .filter((item): item is T => Boolean(item));
}

function hasHomepageImage(article: PublicArticle) {
  return Boolean(
    article.imageSrc || article.coverImageFirebaseUrl || article.coverImage,
  );
}

function selectHeroArticle(
  curated: PublicArticle | null,
  featured: PublicArticle | null,
  latest: PublicArticle[],
) {
  if (curated) return curated;
  if (featured && hasHomepageImage(featured)) return featured;
  return latest.find(hasHomepageImage) || featured || latest[0] || null;
}

function selectEditorialArticles(articles: PublicArticle[]) {
  return articles
    .filter((article) =>
      ["analyse", "opinion", "editorial", "dossier", "fact_check"].includes(
        article.contentType,
      ),
    )
    .slice(0, 4);
}

function selectHomepageCategories(
  categories: PublicCategory[],
  settings: HomepageSettings,
) {
  if (settings.highlightedCategoryIds.length === 0) return categories;
  return orderByIds(categories, settings.highlightedCategoryIds);
}

export async function getPublicCategories(onlyWithArticles = false) {
  const rawCategories = await categoriesRepo.getCategoriesWithCounts(true);
  const categories = rawCategories
    .map((category) =>
      normalizeCategory(
        category,
        (category._count as { articles: number } | undefined)?.articles,
      ),
    )
    .filter((category): category is PublicCategory => {
      if (!category) return false;
      if (!onlyWithArticles) return true;
      return (category.count || 0) > 0;
    });

  const deduped = new Map<string, PublicCategory>();
  for (const category of categories) {
    const key = category.name.toLowerCase();
    const existing = deduped.get(key);
    if (!existing || (category.count || 0) > (existing.count || 0)) {
      deduped.set(key, category);
    }
  }

  return sortCategories([...deduped.values()]);
}

export async function getHomepageContent(): Promise<HomepageContent> {
  let settings = homepageRepo.DEFAULT_HOMEPAGE_SETTINGS;
  let curatedHero: PublicArticle | null = null;
  let curatedSecondary: PublicArticle[] = [];
  let featured: PublicArticle | null = null;
  let latest: PublicArticle[] = [];
  let categories: PublicCategory[] = [];

  try {
    settings = await homepageRepo.getHomepageSettings();
  } catch {
    settings = homepageRepo.DEFAULT_HOMEPAGE_SETTINGS;
  }

  try {
    if (settings.heroArticleId) {
      curatedHero = await hydratePublishedArticleById(settings.heroArticleId);
    }
  } catch {
    curatedHero = null;
  }

  try {
    const selected = await Promise.all(
      settings.secondaryArticleIds.map((id) => hydratePublishedArticleById(id)),
    );
    curatedSecondary = selected.filter(
      (article): article is PublicArticle => Boolean(article),
    );
  } catch {
    curatedSecondary = [];
  }

  try {
    const rawFeatured = await articlesRepo.getFeaturedArticle();
    featured = rawFeatured ? await hydrateArticle(rawFeatured) : null;
  } catch {
    featured = null;
  }

  try {
    const rawLatest = await articlesRepo.getPublishedArticles(24);
    latest = await hydrateArticles(rawLatest);
  } catch {
    latest = [];
  }

  try {
    categories = await getPublicCategories(true);
  } catch {
    categories = [];
  }

  const hero = selectHeroArticle(curatedHero, featured, latest);
  const homepageFeatured =
    featured && hasHomepageImage(featured) ? [featured] : [];
  const allArticles = uniqueById(
    hero
      ? [hero, ...curatedSecondary, ...homepageFeatured, ...latest]
      : [...curatedSecondary, ...homepageFeatured, ...latest],
  );
  const homepageArticles = allArticles.some(hasHomepageImage)
    ? allArticles.filter(hasHomepageImage)
    : allArticles;
  const used = new Set(hero ? [hero.id] : []);
  const remaining = excludeIds(homepageArticles, used);
  const secondary = uniqueById([
    ...curatedSecondary.filter(
      (article) => article.id !== hero?.id && hasHomepageImage(article),
    ),
    ...remaining,
  ]).slice(0, 3);
  secondary.forEach((article) => used.add(article.id));

  const latestList = excludeIds(homepageArticles, used).slice(0, 8);
  latestList.forEach((article) => used.add(article.id));
  const editorial = selectEditorialArticles(excludeIds(homepageArticles, used));
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const recentArticles = allArticles.filter(
    (article) => !article.publishedAt || article.publishedAt >= ninetyDaysAgo,
  );
  const mostReadPool = recentArticles.length >= 3 ? recentArticles : allArticles;
  const usedForMostRead = new Set<string>([
    ...(hero ? [hero.id] : []),
    ...secondary.map((article) => article.id),
    ...latestList.map((article) => article.id),
    ...editorial.map((article) => article.id),
  ]);
  const mostRead = [...mostReadPool]
    .sort((a, b) => b.views - a.views)
    .filter((article) => !usedForMostRead.has(article.id))
    .slice(0, 5);
  const englishSelection = allArticles
    .filter((article) => article.language === "en")
    .slice(0, 4);
  const homepageCategories = selectHomepageCategories(categories, settings);

  return {
    hero,
    secondary,
    latest: latestList,
    editorial,
    mostRead: mostRead.length > 0 ? mostRead : remaining.slice(0, 5),
    categories: homepageCategories.length > 0 ? homepageCategories : categories,
    englishSelection: settings.showEnglishSelection ? englishSelection : [],
    showNewsletter: settings.showNewsletter,
  };
}

export async function getPublicArticleBySlug(slug: string) {
  const rawArticle = await articlesRepo.findBySlug(slug);
  if (!rawArticle || rawArticle.status !== "published") return null;
  return hydrateArticle(rawArticle);
}

export async function getRelatedArticles(article: PublicArticle, take = 3) {
  const poolSize = Math.min(Math.max(take * 4, 8), 24);
  const unique = new Map<string, PublicArticle>();

  function collect(items: PublicArticle[]) {
    for (const item of items) {
      if (item.id === article.id) continue;
      if (!unique.has(item.id)) {
        unique.set(item.id, item);
      }
      if (unique.size >= take) break;
    }
  }

  try {
    if (article.category?.id) {
      const { articles } = await articlesRepo.getArticles({
        status: "published",
        categoryId: article.category.id,
        excludeId: article.id,
        language: article.language,
        take: poolSize,
      });
      collect(await hydrateArticles(articles));
    }

    if (unique.size < take) {
      const { articles } = await articlesRepo.getArticles({
        status: "published",
        excludeId: article.id,
        language: article.language,
        take: poolSize,
      });
      collect(await hydrateArticles(articles));
    }

    return Array.from(unique.values()).slice(0, take);
  } catch {
    return [];
  }
}

export async function getCategoryPageContent(slug: string) {
  const rawCategory = await categoriesRepo.findBySlug(slug);
  if (!rawCategory) return null;

  const category = normalizeCategory(rawCategory);
  if (!category) return null;

  let articles: PublicArticle[] = [];
  try {
    const result = await articlesRepo.getArticles({
      status: "published",
      categoryId: category.id,
      take: 11,
    });
    articles = await hydrateArticles(result.articles);
  } catch {
    articles = [];
  }

  return {
    category: {
      ...category,
      count: articles.length,
    },
    featured: articles[0] || null,
    articles: articles.slice(1),
  };
}

export async function getAuthorPageContent(id: string) {
  const rawAuthor = await usersRepo.getUser(id);
  if (!rawAuthor) return null;

  let articles: PublicArticle[] = [];
  try {
    const result = await articlesRepo.getArticles({
      status: "published",
      authorId: id,
      take: 12,
    });
    articles = await hydrateArticles(result.articles);
  } catch {
    articles = [];
  }

  return {
    author: rawAuthor,
    articles,
  };
}

export async function getEnglishSelection() {
  try {
    const { articles } = await articlesRepo.getArticles({
      status: "published",
      language: "en" satisfies EditorialLanguage,
      take: 24,
    });
    return hydrateArticles(articles);
  } catch {
    return [];
  }
}
