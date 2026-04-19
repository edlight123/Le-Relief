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

export interface PublicArticle {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  body: string;
  excerpt: string | null;
  coverImage: string | null;
  coverImageFirebaseUrl: string | null;
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

  return language === "en" ? "published" : "not_started";
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
      "Articles et analyses publiés par la rédaction.",
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

  return {
    id: asString(article.id),
    title: asString(article.title, "Sans titre"),
    subtitle: asOptionalString(article.subtitle),
    slug: asString(article.slug),
    body,
    excerpt: asOptionalString(article.excerpt),
    coverImage,
    coverImageFirebaseUrl,
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
  };
}

export function sortCategories(categories: PublicCategory[]) {
  return [...categories].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.name.localeCompare(b.name, "fr");
  });
}
