import type { Metadata } from "next";
import { siteConfig } from "@/config/site.config";
import { stripHtml } from "@/lib/editorial";
import type { ArticleStatus } from "@/types/article";

export type SeoLocale = "fr" | "en";

interface MetaDescriptionInput {
  title: string;
  excerpt?: string | null;
  body?: string | null;
  locale: SeoLocale;
  keyword?: string;
  maxLength?: number;
  cta?: string;
}

interface LanguagePathMap {
  fr?: string;
  en?: string;
  "x-default"?: string;
}

interface NewsArticleJsonLdInput {
  headline: string;
  description: string;
  url: string;
  image?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  locale: SeoLocale;
  section?: string | null;
  authorName?: string | null;
  keywords?: string[] | null;
}

interface PersonJsonLdInput {
  name: string;
  url: string;
  image?: string | null;
  description?: string | null;
  jobTitle?: string | null;
}

interface CollectionPageJsonLdInput {
  name: string;
  description: string;
  url: string;
  locale: SeoLocale;
  articles: Array<{ title: string; url: string; datePublished?: string | null; image?: string | null }>;
}

interface BreadcrumbItem {
  name: string;
  item: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

function normalizePath(pathname: string) {
  if (!pathname) return "/";
  if (/^https?:\/\//i.test(pathname)) return pathname;
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

function truncateAtWordBoundary(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  const trimmed = value.slice(0, Math.max(0, maxLength - 1));
  const boundary = trimmed.lastIndexOf(" ");
  return `${(boundary > 80 ? trimmed.slice(0, boundary) : trimmed).trim()}…`;
}

function normalizeText(value?: string | null) {
  if (!value) return "";
  return value.replace(/\s+/g, " ").trim();
}

export function buildAbsoluteUrl(pathname: string) {
  if (/^https?:\/\//i.test(pathname)) return pathname;
  return `${siteConfig.url}${normalizePath(pathname)}`;
}

export function buildCanonicalAlternates(
  currentPath: string,
  languages: LanguagePathMap,
): NonNullable<Metadata["alternates"]> {
  const resolvedLanguages = Object.fromEntries(
    Object.entries(languages)
      .filter(([, path]) => Boolean(path))
      .map(([locale, path]) => [locale, buildAbsoluteUrl(path as string)]),
  );

  return {
    canonical: buildAbsoluteUrl(currentPath),
    languages: resolvedLanguages,
  };
}

export function buildMetaDescription({
  title,
  excerpt,
  body,
  locale,
  keyword,
  maxLength = 160,
  cta,
}: MetaDescriptionInput) {
  const cleanedExcerpt = normalizeText(excerpt);
  const cleanedBody = normalizeText(body ? stripHtml(body) : "");
  const base = cleanedExcerpt || cleanedBody || title;
  const primaryKeyword = normalizeText(keyword) || title;
  const defaultCta =
    locale === "fr"
      ? "Lisez l'analyse complète sur Le Relief."
      : "Read the full coverage on Le Relief.";

  const keywordPrefix = base.toLowerCase().includes(primaryKeyword.toLowerCase())
    ? ""
    : `${primaryKeyword} — `;

  const description = `${keywordPrefix}${base}`.trim();
  const suffix = normalizeText(cta) || defaultCta;
  const composed = `${description.replace(/[.!?]+$/, "")}. ${suffix}`;

  return truncateAtWordBoundary(composed, maxLength);
}

export function buildRobotsDirective(
  status?: ArticleStatus | string | null,
  follow = true,
): NonNullable<Metadata["robots"]> {
  const isIndexable = !status || status === "published";

  return isIndexable
    ? {
        index: true,
        follow,
        googleBot: {
          index: true,
          follow,
          "max-image-preview": "large",
          "max-snippet": -1,
          "max-video-preview": -1,
        },
      }
    : {
        index: false,
        follow: false,
        nocache: true,
        googleBot: {
          index: false,
          follow: false,
          noimageindex: true,
        },
      };
}

/**
 * Route a remote/raw image through Next.js's image optimizer so that:
 *   - EXIF metadata is stripped (avoids orientation / huge thumbnails)
 *   - File size is normalized (Facebook's scraper times out on heavy uploads)
 *   - Output dimensions match the declared `og:image:width` / `og:image:height`
 *
 * Falls back to the absolute URL if the input is already a Le Relief OG endpoint
 * (e.g. `/api/og?...`) or a relative path under the site origin.
 */
export function optimizedOgUrl(absoluteImageUrl: string, width = 1200, quality = 85) {
  // Avoid double-optimizing our own /_next/image or /api/og endpoints.
  if (
    absoluteImageUrl.includes("/_next/image") ||
    absoluteImageUrl.includes("/api/og")
  ) {
    return absoluteImageUrl;
  }
  const optimizerPath = `/_next/image?url=${encodeURIComponent(absoluteImageUrl)}&w=${width}&q=${quality}`;
  return `${siteConfig.url}${optimizerPath}`;
}

export function buildOgImage(
  image: string | null | undefined,
  alt: string,
  fallbackTitle?: string,
) {
  const finalUrl = image
    ? optimizedOgUrl(buildAbsoluteUrl(image))
    : buildAbsoluteUrl(`/api/og?title=${encodeURIComponent(fallbackTitle || alt)}`);

  return [
    {
      url: finalUrl,
      width: 1200,
      height: 630,
      alt,
    },
  ];
}

/**
 * Build a fully editorial Open Graph card URL via /api/og.
 * Preferred for articles — ignores the cover image and uses the
 * Spectral-on-cream branded card with kicker, dateline and masthead.
 */
export function buildEditorialOgImage(input: {
  title: string;
  category?: string | null;
  author?: string | null;
  date?: string | null;
  locale: SeoLocale;
  alt?: string;
}) {
  const params = new URLSearchParams({ title: input.title, locale: input.locale });
  if (input.category) params.set("category", input.category);
  if (input.author) params.set("author", input.author);
  if (input.date) params.set("date", input.date);

  return [
    {
      url: buildAbsoluteUrl(`/api/og?${params.toString()}`),
      width: 1200,
      height: 630,
      alt: input.alt || input.title,
    },
  ];
}


export function buildArticleImageAlt({
  title,
  categoryName,
  caption,
  locale,
}: {
  title: string;
  categoryName?: string | null;
  caption?: string | null;
  locale: SeoLocale;
}) {
  if (caption && caption.trim()) return caption.trim();
  if (categoryName) {
    return locale === "fr"
      ? `Illustration pour l'article ${title}, rubrique ${categoryName}`
      : `Article illustration for ${title} in ${categoryName}`;
  }

  return locale === "fr" ? `Illustration de l'article ${title}` : `Article illustration for ${title}`;
}

export function buildNewsArticleJsonLd({
  headline,
  description,
  url,
  image,
  datePublished,
  dateModified,
  locale,
  section,
  authorName,
  keywords,
}: NewsArticleJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline,
    description,
    image: image ? [buildAbsoluteUrl(image)] : undefined,
    datePublished: datePublished || undefined,
    dateModified: dateModified || datePublished || undefined,
    inLanguage: locale === "fr" ? "fr-FR" : "en-US",
    articleSection: section || undefined,
    mainEntityOfPage: buildAbsoluteUrl(url),
    keywords: keywords?.length ? keywords.join(", ") : undefined,
    author: authorName
      ? {
          "@type": "Person",
          name: authorName,
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: buildAbsoluteUrl("/logo.png"),
      },
    },
  };
}

export function buildPersonJsonLd({ name, url, image, description, jobTitle }: PersonJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    url: buildAbsoluteUrl(url),
    image: image ? buildAbsoluteUrl(image) : undefined,
    description: description || undefined,
    jobTitle: jobTitle || undefined,
    worksFor: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };
}

export function buildCollectionPageJsonLd({
  name,
  description,
  url,
  locale,
  articles,
}: CollectionPageJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: buildAbsoluteUrl(url),
    inLanguage: locale === "fr" ? "fr-FR" : "en-US",
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: articles.slice(0, 10).map((article, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: buildAbsoluteUrl(article.url),
        name: article.title,
      })),
    },
  };
}

export function buildOrganizationJsonLd(locale: SeoLocale) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: buildAbsoluteUrl("/logo.png"),
    description:
      locale === "fr"
        ? "Le Relief est un média numérique haïtien dédié à l'actualité, à l'analyse et à l'intérêt public."
        : "Le Relief is a Haitian digital publication focused on public-interest reporting, analysis and commentary.",
    sameAs: Object.values(siteConfig.socials).filter(Boolean),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      availableLanguage: ["French", "English"],
      url: buildAbsoluteUrl(`/${locale}/contact`),
    },
  };
}

export function buildWebSiteJsonLd(locale: SeoLocale) {
  const searchUrl = buildAbsoluteUrl(`/${locale}/search`);

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: buildAbsoluteUrl(`/${locale}`),
    inLanguage: locale === "fr" ? "fr-FR" : "en-US",
    potentialAction: {
      "@type": "SearchAction",
      target: `${searchUrl}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: buildAbsoluteUrl(item.item),
    })),
  };
}

export function buildFaqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
