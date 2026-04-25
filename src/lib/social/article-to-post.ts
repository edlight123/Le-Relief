/**
 * Maps a Le Relief Article into an EnginePost for the renderer.
 *
 * V1 strategy — keep it dumb but useful: produce a 3-slide carousel
 *   1. cover    → headline
 *   2. detail   → first 2-3 sentences of excerpt/body
 *   3. cta      → "Lire sur lereliefhaiti.com"
 * Editors will refine slide content via a richer editor in a later iteration.
 */

import type {
  ContentIntakeInput,
  PostCaption,
  SlideContent,
} from "@le-relief/renderer";
import type { Article } from "@/types/article";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lereliefhaiti.com";

function stripHtml(input: string | null | undefined): string {
  if (!input) return "";
  return input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function firstSentences(text: string, maxChars = 220): string {
  const clean = stripHtml(text);
  if (clean.length <= maxChars) return clean;
  const slice = clean.slice(0, maxChars);
  const lastStop = Math.max(slice.lastIndexOf("."), slice.lastIndexOf("!"));
  return lastStop > 80 ? slice.slice(0, lastStop + 1) : slice + "…";
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

  const rawSlides: SlideContent[] = [
    {
      slideNumber: 1,
      headline,
      supportLine: supportLine || undefined,
      sourceLine,
      layoutVariant: "cover",
      // Cover image (already upgraded upstream by `upgradeCoverImage`).
      // The cover template renders this as a full-bleed photo with a
      // brand-colour gradient overlay. When absent we fall back to the
      // brand gradient alone.
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
    category: article.category?.slug || "news",
    preferredLanguage: lang,
    urgencyLevel: article.isBreaking ? "breaking" : "normal",
    sourceNote: sourceLine,
  };

  const captionText = [
    headline,
    "",
    stripHtml(article.excerpt) || firstSentences(article.body, 320),
    "",
    `${isFr ? "👉" : "→"} ${articleUrl}`,
  ].join("\n");

  const caption: PostCaption = {
    text: captionText,
    cta: articleUrl,
    hashtags: ["#LeRelief", "#Haïti", isFr ? "#Actualités" : "#News"],
  };

  return {
    intake,
    rawSlides,
    caption,
    contentType: article.contentType || (article.isBreaking ? "breaking" : "news"),
  };
}
