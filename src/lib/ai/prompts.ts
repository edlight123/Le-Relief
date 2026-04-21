import {
  DEFAULT_MAX_GLOSSARY_TERMS,
  formatGlossaryForPrompt,
  takeGlossaryTerms,
} from "@/lib/ai/glossary";
import { getEditorialGlossaryForPrompt } from "@/lib/translation-glossary";
import type {
  GlossaryEntry,
  TranslationInput,
  TranslationModelJson,
  TranslationPromptOptions,
} from "@/lib/ai/types";

export const TRANSLATION_PROMPT_VERSION = "v1.0.0" as const;

const REQUIRED_JSON_KEYS: Array<keyof TranslationModelJson> = [
  "titleEn",
  "subtitleEn",
  "excerptEn",
  "bodyEn",
  "seoTitleEn",
  "seoDescriptionEn",
  "summaryEn",
];

function buildJsonContractText() {
  const keys = REQUIRED_JSON_KEYS.map((key) => `- ${key}: string`).join("\n");
  return [
    "Return only one valid JSON object (no markdown, no code fence, no commentary).",
    "Use exactly these keys with string values:",
    keys,
    "If a source field is missing, return an empty string for the related output key.",
  ].join("\n");
}

function formatInputForPrompt(input: TranslationInput) {
  return JSON.stringify(
    {
      title: input.title,
      subtitle: input.subtitle ?? "",
      excerpt: input.excerpt ?? "",
      body: input.body,
      categoryName: input.categoryName,
      contentType: input.contentType,
      authorName: input.authorName,
      sourceSlug: input.sourceSlug,
    },
    null,
    2,
  );
}

function mergeGlossaryEntries(
  defaultEntries: readonly GlossaryEntry[],
  overrideEntries: readonly GlossaryEntry[] | undefined,
): GlossaryEntry[] {
  const byFrTerm = new Map<string, GlossaryEntry>();

  for (const entry of defaultEntries) {
    byFrTerm.set(entry.fr.trim().toLowerCase(), entry);
  }

  for (const entry of overrideEntries || []) {
    byFrTerm.set(entry.fr.trim().toLowerCase(), entry);
  }

  return [...byFrTerm.values()];
}

export function buildFrenchToEnglishTranslationPrompts(
  input: TranslationInput,
  options: TranslationPromptOptions = {},
): {
  systemPrompt: string;
  userPrompt: string;
  promptVersion: typeof TRANSLATION_PROMPT_VERSION;
} {
  const maxGlossaryTerms = options.maxGlossaryTerms ?? DEFAULT_MAX_GLOSSARY_TERMS;
  const glossaryEntries = takeGlossaryTerms(
    mergeGlossaryEntries(getEditorialGlossaryForPrompt(), options.glossaryEntries),
    maxGlossaryTerms,
  );
  const glossaryBlock = formatGlossaryForPrompt(glossaryEntries);

  const systemPrompt = [
    `Le Relief translation master prompt version: ${TRANSLATION_PROMPT_VERSION}`,
    "You are a newsroom translation editor translating French articles into English.",
    "Editorial constraints:",
    "- Preserve names, dates, numbers, and quoted text faithfully.",
    "- Do not invent facts or add unverified context.",
    "- Keep a neutral, professional newsroom tone.",
    "- Maintain structure and paragraphing from the source body.",
    buildJsonContractText(),
  ].join("\n\n");

  const userPrompt = [
    "Translate the following FR article payload into publication-ready EN fields.",
    "Glossary terms (apply when contextually appropriate):",
    glossaryBlock,
    "Source payload:",
    formatInputForPrompt(input),
  ].join("\n\n");

  return {
    systemPrompt,
    userPrompt,
    promptVersion: TRANSLATION_PROMPT_VERSION,
  };
}
