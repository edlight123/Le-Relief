import * as articlesRepo from "@/lib/repositories/articles";
import * as categoriesRepo from "@/lib/repositories/categories";
import * as homepageRepo from "@/lib/repositories/homepage";
import * as usersRepo from "@/lib/repositories/users";
import type { HomepageSettings } from "@/types/homepage";

export type EditorialLanguage = "fr" | "en";

export type ContentType =
  | "actualite"
  | "analyse"
  | "opinion"
  | "editorial"
  | "tribune"
  | "dossier"
  | "fact_check"
  | "emission_speciale";

export type TranslationStatus =
  | "not_applicable"
  | "not_started"
  | "generated_draft"
  | "in_review"
  | "approved"
  | "published"
  | "rejected";

export interface PublicAuthor {
  id: string;
  name: string;
  image: string | null;
  role: string;
  bio: string | null;
}

export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  count?: number;
  priority: number;
}

export interface TocEntry {
  id: string;
  level: 2 | 3;
  text: string;
}

export interface PublicArticle {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  body: string;
  excerpt: string | null;
  coverImage: string | null;
  coverImageFirebaseUrl: string | null;
  coverImageCaption: string | null;
  imageSrc: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
  author: PublicAuthor | null;
  category: PublicCategory | null;
  tags: string[];
  status: string;
  featured: boolean;
  views: number;
  language: EditorialLanguage;
  contentType: ContentType;
  contentTypeLabel: string;
  readingTime: number;
  translationStatus: TranslationStatus;
  isCanonicalSource: boolean;
  sourceArticleId: string | null;
  alternateLanguageSlug: string | null;
  toc: TocEntry[];
}

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  actualite: "Actualité",
  analyse: "Analyse",
  opinion: "Opinion",
  editorial: "Éditorial",
  tribune: "Tribune",
  dossier: "Dossier",
  fact_check: "Fact-checking",
  emission_speciale: "Émission spéciale",
};

const TRANSLATION_STATUS_LABELS: Record<TranslationStatus, string> = {
  not_applicable: "Non concerné",
  not_started: "Traduction non lancée",
  generated_draft: "Brouillon IA",
  in_review: "En revue",
  approved: "Approuvé",
  published: "Publié",
  rejected: "Rejeté",
};

const CATEGORY_OVERRIDES: Record<
  string,
  { name: string; description: string; priority: number }
> = {
  politique: {
    name: "Politique",
    description:
      "Institutions, pouvoir public, gouvernance et rapports de force en Haïti.",
    priority: 10,
  },
  economie: {
    name: "Économie",
    description:
      "Entreprises, finances publiques, marchés, emplois et décisions économiques.",
    priority: 20,
  },
  business: {
    name: "Économie",
    description:
      "Entreprises, finances publiques, marchés, emplois et décisions économiques.",
    priority: 20,
  },
  societe: {
    name: "Société",
    description:
      "Éducation, sécurité, justice, santé, diaspora et vie quotidienne.",
    priority: 30,
  },
  technology: {
    name: "Société numérique",
    description:
      "Usages numériques, innovation, plateformes et transformations sociales.",
    priority: 35,
  },
  culture: {
    name: "Culture",
    description:
      "Arts, mémoire, littérature, musique et conversations culturelles.",
    priority: 40,
  },
  international: {
    name: "International",
    description:
      "Ce que les dynamiques régionales et mondiales changent pour Haïti.",
    priority: 50,
  },
  world: {
    name: "International",
    description:
      "Ce que les dynamiques régionales et mondiales changent pour Haïti.",
    priority: 50,
  },
  analyse: {
    name: "Analyse",
    description:
      "Contexte, explications et lecture approfondie des faits publics.",
    priority: 60,
  },
  opinion: {
    name: "Opinion",
    description:
      "Tribunes, points de vue et débats clairement distingués de l'actualité.",
    priority: 70,
  },
  editorial: {
    name: "Éditorial",
    description:
      "La position de la rédaction sur les sujets majeurs de la vie publique.",
    priority: 80,
  },
  dossiers: {
    name: "Dossiers",
    description:
      "Séries, enquêtes et formats spéciaux à suivre dans la durée.",
    priority: 90,
  },
  science: {
    name: "Science",
    description:
      "Recherche, santé, environnement et données utiles au débat public.",
    priority: 95,
  },
  actualite: {
    name: "Actualités",
    description:
      "Les faits marquants du jour, vérifiés et mis en contexte par la rédaction.",
    priority: 5,
  },
  actualites: {
    name: "Actualités",
    description:
      "Les faits marquants du jour, vérifiés et mis en contexte par la rédaction.",
    priority: 5,
  },
  sante: {
    name: "Santé",
    description:
      "Système de soins, santé publique, prévention et enjeux médicaux en Haïti.",
    priority: 45,
  },
  sport: {
    name: "Sport",
    description:
      "Football, performances, fédérations et grands rendez-vous sportifs.",
    priority: 85,
  },
  tribune: {
    name: "Tribune",
    description:
      "Espace de débats et de prises de position signées, distinctes de l'actualité.",
    priority: 75,
  },
  emission_speciale: {
    name: "Émission spéciale",
    description:
      "Formats vidéo et audio produits par la rédaction sur des sujets clés.",
    priority: 92,
  },
  "emission-speciale": {
    name: "Émission spéciale",
    description:
      "Formats vidéo et audio produits par la rédaction sur des sujets clés.",
    priority: 92,
  },
};

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeSlug(value: string) {
  return value.trim().toLowerCase();
}

export function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function getReadingTime(body: string) {
  const words = stripHtml(body).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 225));
}

export function getContentTypeLabel(contentType: ContentType) {
  return CONTENT_TYPE_LABELS[contentType];
}

export function getTranslationStatusLabel(status: TranslationStatus) {
  return TRANSLATION_STATUS_LABELS[status];
}

export function normalizeLanguage(value: unknown): EditorialLanguage {
  return value === "en" ? "en" : "fr";
}

export function normalizeTranslationStatus(
  value: unknown,
  language: EditorialLanguage,
): TranslationStatus {
  const allowed: TranslationStatus[] = [
    "not_applicable",
    "not_started",
    "generated_draft",
    "in_review",
    "approved",
    "published",
    "rejected",
  ];

  if (typeof value === "string" && allowed.includes(value as TranslationStatus)) {
    return value as TranslationStatus;
  }

  // FR articles default to not_started (no translation);
  // EN articles must have explicit status (no auto-publish assumption)
  return language === "fr" ? "not_applicable" : "not_started";
}

export function normalizeCategory(
  category: Record<string, unknown> | null,
  count?: number,
): PublicCategory | null {
  if (!category?.id || !category.slug) return null;

  const slug = asString(category.slug);
  const override = CATEGORY_OVERRIDES[normalizeSlug(slug)];

  return {
    id: asString(category.id),
    slug,
    name: override?.name || asString(category.name, "Rubrique"),
    description:
      override?.description ||
      asOptionalString(category.description) ||
      null,
    count,
    priority: override?.priority || 100,
  };
}

export function normalizeAuthor(author: Record<string, unknown> | null) {
  if (!author?.id) return null;

  return {
    id: asString(author.id),
    name: asString(author.name, "La rédaction"),
    image: asOptionalString(author.image),
    role: asString(author.roleFr, asString(author.role, "Rédaction")),
    bio: asOptionalString(author.bioFr) || asOptionalString(author.bio),
  } satisfies PublicAuthor;
}

export function normalizeContentType(
  article: Record<string, unknown>,
  category: PublicCategory | null,
): ContentType {
  const rawType = asOptionalString(article.contentType)?.replace("-", "_");
  const allowed: ContentType[] = [
    "actualite",
    "analyse",
    "opinion",
    "editorial",
    "tribune",
    "dossier",
    "fact_check",
    "emission_speciale",
  ];

  if (rawType && allowed.includes(rawType as ContentType)) {
    return rawType as ContentType;
  }

  const tags = Array.isArray(article.tags)
    ? article.tags.map((tag) => String(tag).toLowerCase())
    : [];
  const categorySlug = category?.slug.toLowerCase() || "";
  const categoryName = category?.name.toLowerCase() || "";
  const haystack = [categorySlug, categoryName, ...tags].join(" ");

  if (haystack.includes("fact")) return "fact_check";
  if (haystack.includes("dossier")) return "dossier";
  if (haystack.includes("tribune")) return "tribune";
  if (haystack.includes("opinion")) return "opinion";
  if (haystack.includes("éditorial") || haystack.includes("editorial")) {
    return "editorial";
  }
  if (haystack.includes("analyse")) return "analyse";

  return "actualite";
}

export function generateTocFromHtml(html: string): { body: string; toc: TocEntry[] } {
  const toc: TocEntry[] = [];
  const usedIds = new Set<string>();

  const body = html.replace(
    /<(h[23])([^>]*)>([\s\S]*?)<\/h[23]>/gi,
    (_match, tag: string, attrs: string, inner: string) => {
      const text = inner.replace(/<[^>]*>/g, "").trim();
      const base = text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        || "section";

      let id = base;
      let n = 1;
      while (usedIds.has(id)) id = `${base}-${n++}`;
      usedIds.add(id);

      toc.push({ id, level: parseInt(tag[1]) as 2 | 3, text });
      return `<${tag}${attrs} id="${id}">${inner}</${tag}>`;
    },
  );

  return { body, toc };
}

function normalizeForTagComparison(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function deduplicateTags(
  rawTags: string[],
  contentType: ContentType,
  category: PublicCategory | null,
): string[] {
  const base = normalizeForTagComparison(contentType);
  const redundant = new Set([
    base,
    base + "s",
    normalizeForTagComparison(contentType.replace("_", "")),
    normalizeForTagComparison(contentType.replace("_", "")) + "s",
    ...(category
      ? [
          normalizeForTagComparison(category.slug),
          normalizeForTagComparison(category.slug) + "s",
          normalizeForTagComparison(category.name),
          normalizeForTagComparison(category.name) + "s",
        ]
      : []),
  ]);
  return rawTags.filter((tag) => !redundant.has(normalizeForTagComparison(tag)));
}

export function normalizeArticle(
  article: Record<string, unknown>,
  author: Record<string, unknown> | null,
  category: Record<string, unknown> | null,
): PublicArticle {
  const normalizedCategory = normalizeCategory(category);
  const language = normalizeLanguage(article.language);
  const body = asString(article.body);
  const contentType = normalizeContentType(article, normalizedCategory);
  const coverImage = asOptionalString(article.coverImage);
  const coverImageFirebaseUrl = asOptionalString(article.coverImageFirebaseUrl);
  const publishedAt = asOptionalString(article.publishedAt);
  const updatedAt = asOptionalString(article.updatedAt);
  const rawTags = Array.isArray(article.tags) ? article.tags.map(String) : [];
  const bodyHasHtml = /<\/?[a-z][\s\S]*>/i.test(body);
  const { body: processedBody, toc } = bodyHasHtml
    ? generateTocFromHtml(body)
    : { body, toc: [] };

  return {
    id: asString(article.id),
    title: asString(article.title, "Sans titre"),
    subtitle: asOptionalString(article.subtitle),
    slug: asString(article.slug),
    body: processedBody,
    excerpt: asOptionalString(article.excerpt),
    coverImage,
    coverImageFirebaseUrl,
    coverImageCaption: asOptionalString(article.coverImageCaption),
    imageSrc: coverImageFirebaseUrl || coverImage,
    publishedAt,
    updatedAt,
    author: normalizeAuthor(author),
    category: normalizedCategory,
    tags: deduplicateTags(rawTags, contentType, normalizedCategory),
    status: asString(article.status, "draft"),
    featured: asBoolean(article.featured),
    views: asNumber(article.views),
    language,
    contentType,
    contentTypeLabel: contentType !== "actualite" ? getContentTypeLabel(contentType) : "",
    readingTime: getReadingTime(body),
    translationStatus: normalizeTranslationStatus(
      article.translationStatus,
      language,
    ),
    isCanonicalSource:
      typeof article.isCanonicalSource === "boolean"
        ? article.isCanonicalSource
        : language === "fr",
    sourceArticleId: asOptionalString(article.sourceArticleId),
    alternateLanguageSlug: asOptionalString(article.alternateLanguageSlug),
    toc,
  };
}

export function sortCategories(categories: PublicCategory[]) {
  return [...categories].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.name.localeCompare(b.name, "fr");
  });
}

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

export async function getPublicCategories(
  onlyWithArticles = false,
  locale?: EditorialLanguage,
) {
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

  if (!locale) {
    return sortCategories(categories);
  }

  const languageCounts = await categoriesRepo.getCategoryCountsByLanguage(
    locale,
    true,
  );
  const withLanguageCount = categories.map((category) => ({
    ...category,
    count: languageCounts.get(category.id) || 0,
  }));

  return sortCategories(
    withLanguageCount.filter((category) =>
      onlyWithArticles ? (category.count || 0) > 0 : true,
    ),
  );
}

export async function getHomepageContent(
  locale: EditorialLanguage = "fr",
): Promise<HomepageContent> {
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
    if (settings.heroArticleId && !settings.autoHero) {
      curatedHero = await hydratePublishedArticleById(settings.heroArticleId);
      if (curatedHero?.language !== locale) curatedHero = null;
    }
  } catch {
    curatedHero = null;
  }

  try {
    const selected = await Promise.all(
      settings.secondaryArticleIds.map((id) => hydratePublishedArticleById(id)),
    );
    curatedSecondary = selected.filter(
      (article): article is PublicArticle => article?.language === locale,
    );
  } catch {
    curatedSecondary = [];
  }

  try {
    const rawFeatured = await articlesRepo.getFeaturedArticle();
    featured = rawFeatured ? await hydrateArticle(rawFeatured) : null;
    if (featured?.language !== locale) featured = null;
    if (settings.autoHero) featured = null;
  } catch {
    featured = null;
  }

  try {
    const rawLatest = await articlesRepo.getPublishedArticles(24, locale);
    latest = await hydrateArticles(rawLatest);
  } catch {
    latest = [];
  }

  try {
    categories = await getPublicCategories(true, locale);
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
  const homepageArticles = allArticles;
  const used = new Set(hero ? [hero.id] : []);
  const remaining = excludeIds(homepageArticles, used);
  const secondary = uniqueById([
    ...curatedSecondary.filter(
      (article) => article.id !== hero?.id,
    ),
    ...remaining,
  ]).slice(0, 3);
  secondary.forEach((article) => used.add(article.id));

  const latestList = excludeIds(homepageArticles, used).slice(0, 8);
  latestList.forEach((article) => used.add(article.id));
  const editorial = selectEditorialArticles(excludeIds(homepageArticles, used));
  const ninetyDaysAgo = new Date(
    Date.now() - 90 * 24 * 60 * 60 * 1000,
  ).toISOString();
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
  const homepageCategories = selectHomepageCategories(categories, settings);

  const englishSelection =
    locale === "fr"
      ? await getEnglishSelection()
      : allArticles.filter((article) => article.language === "en").slice(0, 4);

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

export async function getPublicArticleBySlug(
  slug: string,
  locale?: EditorialLanguage,
) {
  const rawArticle = await articlesRepo.findBySlug(slug, locale);
  if (!rawArticle || rawArticle.status !== "published") return null;
  if (locale && rawArticle.language !== locale) return null;
  return hydrateArticle(rawArticle);
}

export async function getRelatedArticles(
  article: PublicArticle,
  take = 3,
  locale?: EditorialLanguage,
) {
  const targetLanguage = locale || article.language;
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
        language: targetLanguage,
        take: poolSize,
      });
      collect(await hydrateArticles(articles));
    }

    if (unique.size < take) {
      const { articles } = await articlesRepo.getArticles({
        status: "published",
        excludeId: article.id,
        language: targetLanguage,
        take: poolSize,
      });
      collect(await hydrateArticles(articles));
    }

    return Array.from(unique.values()).slice(0, take);
  } catch {
    return [];
  }
}

export async function getCategoryPageContent(
  slug: string,
  locale: EditorialLanguage,
) {
  const rawCategory = await categoriesRepo.findBySlug(slug);
  if (!rawCategory) return null;

  const category = normalizeCategory(rawCategory);
  if (!category) return null;

  let articles: PublicArticle[] = [];
  try {
    const result = await articlesRepo.getArticles({
      status: "published",
      categoryId: category.id,
      language: locale,
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

export async function getAuthorPageContent(
  id: string,
  locale: EditorialLanguage,
) {
  const rawAuthor = await usersRepo.getUser(id);
  if (!rawAuthor) return null;

  let articles: PublicArticle[] = [];
  try {
    const result = await articlesRepo.getArticles({
      status: "published",
      authorId: id,
      language: locale,
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
