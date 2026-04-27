import type { ArticleContentType } from "@/types/article";

export type TranslationProvider = "openai" | "gemini" | "deepseek";

export interface TranslationInput {
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  body: string;
  categoryName: string;
  contentType: ArticleContentType;
  authorName: string;
  sourceSlug: string;
}

export interface GlossaryEntry {
  fr: string;
  en: string;
  note?: string;
}

export interface TranslationPromptOptions {
  glossaryEntries?: GlossaryEntry[];
  maxGlossaryTerms?: number;
}

export interface TranslationOutputFields {
  titleEn: string;
  subtitleEn: string;
  excerptEn: string;
  bodyEn: string;
  seoTitleEn: string;
  seoDescriptionEn: string;
  summaryEn: string;
}

export interface TranslationResult extends TranslationOutputFields {
  provider: TranslationProvider;
  model: string;
  promptVersion: string;
  rawResponse: string;
}

export type TranslationModelJson = TranslationOutputFields;
