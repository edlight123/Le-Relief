/**
 * Maps a Le Relief Article into an EnginePost for the renderer.
 *
 * V1 strategy — keep it dumb but useful: produce a 3-slide carousel
 *   1. cover    → headline
 *   2. detail   → first 2-3 sentences of excerpt/body
 *   3. cta      → "Lire sur lereliefhaiti.com"
 * Editors will refine slide content via a richer editor in a later iteration.
 *
 * Caption strategy per platform:
 *   - Instagram/Facebook → `caption.text`  (full headline + excerpt + URL)
 *   - X / Threads        → `caption.shortText` (Le Relief style: Flash 🚨 or 🇭🇹 headline)
 *   - WhatsApp Status    → `caption.shortText` (no hashtags, no URL)
 */

import type {
  ContentIntakeInput,
  PostCaption,
  SlideContent,
} from "@le-relief/renderer";
import type { Article } from "@/types/article";
import { generateAISlides } from "./ai-slides";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lereliefhaiti.com";

function stripHtml(input: string | null | undefined): string {
  if (!input) return "";
  return input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** Coerce a Date | ISO-string | Firestore Timestamp-ish value to ISO string. */
function toIso(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const v = value as { toDate?: () => Date; seconds?: number; _seconds?: number };
    if (typeof v.toDate === "function") return v.toDate().toISOString();
    const secs = v.seconds ?? v._seconds;
    if (typeof secs === "number") return new Date(secs * 1000).toISOString();
  }
  return undefined;
}

function firstSentences(text: string, maxChars = 220): string {
  const clean = stripHtml(text);
  if (clean.length <= maxChars) return clean;
  const slice = clean.slice(0, maxChars);
  const lastStop = Math.max(slice.lastIndexOf("."), slice.lastIndexOf("!"));
  return lastStop > 80 ? slice.slice(0, lastStop + 1) : slice + "…";
}

/**
 * Build a short X/Threads/WhatsApp-style caption in Le Relief's voice.
 *
 * Caricature → "CARICATURE du jour avec Le Relief\n\nDessinateur : {author}"
 * Breaking   → "Flash 🚨\n\n🇭🇹 {headline}"
 * Regular    → "🇭🇹 {headline}" (truncated to 200 chars if needed)
 */
function buildShortCaption(
  headline: string,
  isBreaking: boolean,
  isCaricature = false,
  caricatureAuthor?: string,
): string {
  if (isCaricature) {
    const credit = caricatureAuthor ? `Dessinateur : ${caricatureAuthor}` : "Dessinateur : Francisco Silva";
    return `CARICATURE du jour avec Le Relief\n\n${credit}`;
  }
  if (isBreaking) {
    return `Flash 🚨\n\n🇭🇹 ${headline}`;
  }
  const prefix = "🇭🇹 ";
  const full = `${prefix}${headline}`;
  if (full.length <= 200) return full;
  return `${prefix}${headline.slice(0, 200 - prefix.length - 1)}…`;
}

/**
 * Category-aware hashtags matching Le Relief's topical coverage.
 * Includes both #Haïti and #Haiti for bilingual discoverability.
 */
function buildHashtags(
  categorySlug: string,
  isFr: boolean,
  isBreaking: boolean,
): string[] {
  const base = ["#LeRelief", "#Haïti", "#Haiti"];
  if (isFr) base.push("#Actualités"); else base.push("#News");
  if (isBreaking) base.push("#Flash");

  const categoryMap: Record<string, string> = {
    politique: "#Politique",
    securite: "#Sécurité",
    "securite-publique": "#Sécurité",
    economie: "#Économie",
    culture: "#Culture",
    sport: "#Sport",
    sports: "#Sport",
    diaspora: "#Diaspora",
    education: "#Éducation",
    sante: "#Santé",
    environnement: "#Environnement",
    international: "#International",
    justice: "#Justice",
    droits: "#DroitsHumains",
    social: "#Social",
    technologie: "#Tech",
    humanitaire: "#Humanitaire",
  };
  const catTag = categoryMap[categorySlug];
  if (catTag) base.push(catTag);

  return base;
}

export interface ArticleSocialContent {
  intake: ContentIntakeInput;
  rawSlides: SlideContent[];
  caption: PostCaption;
  contentType: string;
}

export function articleToSocialContent(article: Article): ArticleSocialContent {
  const lang = article.language === "en" ? "en" : "fr";
  const isFr = lang === "fr";
  const sourceLine = article.author?.name
    ? `${isFr ? "Par" : "By"} ${article.author.name}`
    : isFr
      ? "Rédaction Le Relief"
      : "Le Relief Newsroom";

  const headline = article.title.trim();
  const supportLine = article.subtitle?.trim() || article.excerpt?.trim() || "";
  const detailBody = firstSentences(article.body, 260);

  const articleUrl = `${SITE_URL}${isFr ? "" : "/en"}/articles/${article.slug}`;
  const ctaSupport = isFr
    ? `Lire l'article complet sur ${SITE_URL.replace(/^https?:\/\//, "")}.`
    : `Read the full story on ${SITE_URL.replace(/^https?:\/\//, "")}.`;

  const isBreaking = Boolean(article.isBreaking);
  const categorySlug = article.category?.slug || "news";
  const contentType = article.contentType || (article.isBreaking ? "breaking" : "news");
  const isCaricature = categorySlug === "caricature" || categorySlug === "caricatures" || categorySlug === "humour";
  const excerptClean = stripHtml(article.excerpt);
  const firstFact = excerptClean || firstSentences(article.body, 200);
  const authorName = article.author?.name;

  // ── Slides ──────────────────────────────────────────────────────────────────

  const rawSlides: SlideContent[] = isCaricature
    ? [
        {
          slideNumber: 1,
          headline: `CARICATURE du jour avec Le Relief`,
          supportLine: authorName ? `Dessinateur : ${authorName}` : "Dessinateur : Francisco Silva",
          sourceLine,
          layoutVariant: "cover",
          imageUrl: article.coverImage?.trim() || undefined,
        },
      ]
    : [
        {
          slideNumber: 1,
          headline,
          supportLine: supportLine || undefined,
          sourceLine,
          layoutVariant: "cover",
          imageUrl: article.coverImage?.trim() || undefined,
        },
        {
          slideNumber: 2,
          headline: isFr ? "L'essentiel" : "Key points",
          body: detailBody,
          sourceLine,
          layoutVariant: "detail",
        },
        {
          slideNumber: 3,
          headline: isFr ? "Lire l'article" : "Read more",
          supportLine: ctaSupport,
          sourceLine,
          layoutVariant: "cta",
        },
      ];

  const intake: ContentIntakeInput = {
    topic: headline,
    sourceSummary: stripHtml(article.excerpt) || stripHtml(article.body).slice(0, 400),
    keyFacts: firstFact ? [firstFact] : undefined,
    category: categorySlug,
    preferredLanguage: lang,
    urgencyLevel: isBreaking ? "breaking" : "normal",
    sourceNote: sourceLine,
    // serializeTimestamps() flattens Firestore Timestamps to ISO strings on
    // the way out of the repository, but the static type still says Date.
    // Accept either and normalise to an ISO string for the renderer.
    date: toIso(article.publishedAt) ?? toIso(article.updatedAt) ?? undefined,
    // Caricature must use the dedicated template — skip generic routing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contentTypeHint: isCaricature ? ("caricature-card" as any) : undefined,
  };

  const captionText = isCaricature
    ? [
        `CARICATURE du jour avec Le Relief`,
        "",
        authorName ? `Dessinateur : ${authorName}` : "Dessinateur : Francisco Silva",
        "",
        `👉 ${articleUrl}`,
      ].join("\n")
    : [
        headline,
        "",
        excerptClean || firstSentences(article.body, 320),
        "",
        `${isFr ? "👉" : "→"} ${articleUrl}`,
      ].join("\n");

  const caption: PostCaption = {
    text: captionText,
    shortText: buildShortCaption(headline, isBreaking, isCaricature, authorName ?? undefined),
    cta: articleUrl,
    hashtags: buildHashtags(categorySlug, isFr, isBreaking),
  };

  return {
    intake,
    rawSlides,
    caption,
    contentType,
  };
}

/**
 * Async version of `articleToSocialContent` that first tries AI-assisted
 * slide generation. Falls back to the synchronous version on any error or
 * when `SOCIAL_AI_ENABLED` is not set.
 */
export async function articleToSocialContentAsync(
  article: Article,
): Promise<ArticleSocialContent> {
  const lang = article.language === "en" ? "en" : "fr";
  const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://lereliefhaiti.com";
  const articleUrl = `${SITE}${lang === "fr" ? "" : "/en"}/articles/${article.slug}`;

  try {
    const ai = await generateAISlides({
      title: article.title,
      excerpt: article.excerpt ?? undefined,
      body: article.body ?? "",
      category: article.category?.slug ?? "news",
      language: lang,
      isBreaking: Boolean(article.isBreaking),
      articleUrl,
    });

    if (ai) {
      const base = articleToSocialContent(article);
      return {
        ...base,
        rawSlides: ai.slides,
        caption: ai.caption,
      };
    }
  } catch {
    // soft fail — fall through to synchronous version
  }

  return articleToSocialContent(article);
}
