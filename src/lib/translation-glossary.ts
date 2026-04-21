import type { GlossaryEntry as PromptGlossaryEntry } from "@/lib/ai/types";
import { stripHtml } from "@/lib/editorial";

export interface EditorialGlossaryTerm {
  id: string;
  fr: string;
  en: string;
  note?: string;
  enAlternates?: string[];
}

export interface GlossaryReplacement {
  termId: string;
  from: string;
  to: string;
  count: number;
}

export interface GlossaryConsistencyWarning {
  type: "missing_expected_term" | "non_preferred_term";
  termId: string;
  fr: string;
  expectedEn: string;
  found?: string;
  message: string;
}

export interface SourceLinkWarning {
  type: "missing_source_link";
  url: string;
  message: string;
}

const EDITORIAL_BILINGUAL_GLOSSARY: readonly EditorialGlossaryTerm[] = [
  {
    id: "haiti",
    fr: "Haïti",
    en: "Haiti",
    note: "Always keep the country name in English as Haiti.",
  },
  {
    id: "pm",
    fr: "Premier ministre",
    en: "Prime Minister",
    enAlternates: ["premier"],
  },
  {
    id: "pnc",
    fr: "Police nationale d'Haïti",
    en: "Haitian National Police",
    enAlternates: ["National Police of Haiti", "Haiti National Police"],
  },
  {
    id: "conseil-ministres",
    fr: "Conseil des ministres",
    en: "Council of Ministers",
  },
  {
    id: "garde-a-vue",
    fr: "garde à vue",
    en: "police custody",
    enAlternates: ["custody detention"],
  },
  {
    id: "communique",
    fr: "communiqué",
    en: "statement",
    enAlternates: ["press release"],
  },
  {
    id: "ministere-justice",
    fr: "Ministère de la Justice",
    en: "Ministry of Justice",
  },
  {
    id: "ministere-sante",
    fr: "Ministère de la Santé publique",
    en: "Ministry of Public Health",
  },
  {
    id: "societe-civile",
    fr: "société civile",
    en: "civil society",
  },
  {
    id: "forces-ordre",
    fr: "forces de l'ordre",
    en: "law enforcement",
    enAlternates: ["security forces"],
  },
] as const;

const WORD_CHAR_PATTERN = /[A-Za-zÀ-ÖØ-öø-ÿ0-9_]/;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasWordBoundaries(value: string): boolean {
  const first = value[0] || "";
  const last = value[value.length - 1] || "";
  return WORD_CHAR_PATTERN.test(first) && WORD_CHAR_PATTERN.test(last);
}

function buildTermRegex(value: string): RegExp {
  const escaped = escapeRegExp(value.trim());
  if (!escaped) {
    return /$a/;
  }

  if (hasWordBoundaries(value)) {
    return new RegExp(`\\b${escaped}\\b`, "gi");
  }

  return new RegExp(escaped, "gi");
}

function normalizeText(value: string): string {
  return stripHtml(value).replace(/\s+/g, " ").trim();
}

function countTermInText(text: string, term: string): number {
  return (text.match(buildTermRegex(term)) || []).length;
}

function containsTerm(text: string, term: string): boolean {
  return countTermInText(text, term) > 0;
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return "";
  }

  try {
    const parsed = new URL(trimmed);
    parsed.hash = "";
    const normalizedPath = parsed.pathname.replace(/\/$/, "") || "/";
    return `${parsed.origin}${normalizedPath}${parsed.search}`;
  } catch {
    return trimmed.replace(/\/$/, "");
  }
}

function extractLinksFromText(value: string): string[] {
  const links = new Set<string>();
  const htmlHrefRegex = /href\s*=\s*["']([^"']+)["']/gi;
  const markdownLinkRegex = /\[[^\]]+\]\((https?:\/\/[^)\s]+)\)/gi;
  const bareUrlRegex = /https?:\/\/[^\s<>")]+/gi;

  for (const regex of [htmlHrefRegex, markdownLinkRegex, bareUrlRegex]) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(value)) !== null) {
      const candidate = normalizeUrl(match[1] || match[0] || "");
      if (candidate) {
        links.add(candidate);
      }
    }
  }

  return [...links];
}

export function getEditorialBilingualGlossary(): EditorialGlossaryTerm[] {
  return [...EDITORIAL_BILINGUAL_GLOSSARY];
}

export function getEditorialGlossaryForPrompt(): PromptGlossaryEntry[] {
  return EDITORIAL_BILINGUAL_GLOSSARY.map((term) => ({
    fr: term.fr,
    en: term.en,
    note: term.note,
  }));
}

export function applyGlossaryToEnglishText(
  text: string,
  terms: readonly EditorialGlossaryTerm[] = EDITORIAL_BILINGUAL_GLOSSARY,
): { text: string; replacements: GlossaryReplacement[] } {
  let nextText = text;
  const replacements: GlossaryReplacement[] = [];

  for (const term of terms) {
    for (const alternate of term.enAlternates || []) {
      const pattern = buildTermRegex(alternate);
      const count = (nextText.match(pattern) || []).length;
      if (count === 0) {
        continue;
      }

      nextText = nextText.replace(pattern, term.en);
      replacements.push({
        termId: term.id,
        from: alternate,
        to: term.en,
        count,
      });
    }
  }

  return { text: nextText, replacements };
}

export function checkGlossaryConsistencyForEnTranslation(params: {
  sourceText: string;
  translatedText: string;
  terms?: readonly EditorialGlossaryTerm[];
}): GlossaryConsistencyWarning[] {
  const sourceText = normalizeText(params.sourceText);
  const translatedText = normalizeText(params.translatedText);
  const terms = params.terms || EDITORIAL_BILINGUAL_GLOSSARY;
  const warnings: GlossaryConsistencyWarning[] = [];

  for (const term of terms) {
    if (!containsTerm(sourceText, term.fr)) {
      continue;
    }

    const expectedPresent = containsTerm(translatedText, term.en);
    if (!expectedPresent) {
      warnings.push({
        type: "missing_expected_term",
        termId: term.id,
        fr: term.fr,
        expectedEn: term.en,
        message: `Expected EN term "${term.en}" for FR term "${term.fr}" was not found.`,
      });
    }

    for (const alternate of term.enAlternates || []) {
      if (containsTerm(translatedText, alternate)) {
        warnings.push({
          type: "non_preferred_term",
          termId: term.id,
          fr: term.fr,
          expectedEn: term.en,
          found: alternate,
          message: `Found non-preferred EN term "${alternate}" for FR term "${term.fr}". Prefer "${term.en}".`,
        });
      }
    }
  }

  return warnings;
}

export function checkSourceLinkIntegrity(params: {
  sourceBody: string;
  translatedBody: string;
}): SourceLinkWarning[] {
  const sourceLinks = extractLinksFromText(params.sourceBody);
  const translatedLinks = new Set(extractLinksFromText(params.translatedBody));

  const warnings: SourceLinkWarning[] = [];

  for (const link of sourceLinks) {
    if (!translatedLinks.has(link)) {
      warnings.push({
        type: "missing_source_link",
        url: link,
        message: `Source link missing in EN translation: ${link}`,
      });
    }
  }

  return warnings;
}
