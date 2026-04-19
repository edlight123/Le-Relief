import * as articlesRepo from "@/lib/repositories/articles";
import * as categoriesRepo from "@/lib/repositories/categories";
import * as usersRepo from "@/lib/repositories/users";
import {
  type EditorialLanguage,
  type PublicArticle,
  type PublicCategory,
  normalizeArticle,
  normalizeCategory,
  sortCategories,
} from "@/lib/editorial";

export interface HomepageContent {
  hero: PublicArticle | null;
  secondary: PublicArticle[];
  latest: PublicArticle[];
  editorial: PublicArticle[];
  mostRead: PublicArticle[];
  categories: PublicCategory[];
  englishSelection: PublicArticle[];
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

function selectEditorialArticles(articles: PublicArticle[]) {
  const preferred = articles.filter((article) =>
    ["analyse", "opinion", "editorial", "dossier", "fact_check"].includes(
      article.contentType,
    ),
  );

  return uniqueById([...preferred, ...articles]).slice(0, 4);
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
  let featured: PublicArticle | null = null;
  let latest: PublicArticle[] = [];
  let categories: PublicCategory[] = [];

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

  const allArticles = uniqueById(featured ? [featured, ...latest] : latest);
  const hero = featured || allArticles[0] || null;
  const used = new Set(hero ? [hero.id] : []);
  const remaining = excludeIds(allArticles, used);
  const secondary = remaining.slice(0, 3);
  secondary.forEach((article) => used.add(article.id));

  const latestList = excludeIds(allArticles, used).slice(0, 8);
  latestList.forEach((article) => used.add(article.id));
  const editorial = selectEditorialArticles(excludeIds(allArticles, used));
  const mostRead = [...allArticles]
    .sort((a, b) => b.views - a.views)
    .filter((article) => article.id !== hero?.id)
    .slice(0, 5);
  const englishSelection = allArticles
    .filter((article) => article.language === "en")
    .slice(0, 4);

  return {
    hero,
    secondary,
    latest: latestList,
    editorial,
    mostRead: mostRead.length > 0 ? mostRead : remaining.slice(0, 5),
    categories,
    englishSelection,
  };
}

export async function getPublicArticleBySlug(slug: string) {
  const rawArticle = await articlesRepo.findBySlug(slug);
  if (!rawArticle || rawArticle.status !== "published") return null;
  return hydrateArticle(rawArticle);
}

export async function getRelatedArticles(article: PublicArticle, take = 3) {
  try {
    const { articles } = await articlesRepo.getArticles({
      status: "published",
      categoryId: article.category?.id,
      excludeId: article.id,
      take,
    });
    return hydrateArticles(articles);
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
      take: 30,
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
      take: 30,
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
