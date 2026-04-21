import type { GlossaryEntry } from "@/lib/ai/types";

export const DEFAULT_MAX_GLOSSARY_TERMS = 30;

export function normalizeGlossaryEntries(
  entries: readonly GlossaryEntry[] | undefined,
): GlossaryEntry[] {
  if (!entries?.length) {
    return [];
  }

  return entries
    .map((entry) => ({
      fr: entry.fr.trim(),
      en: entry.en.trim(),
      note: entry.note?.trim() || undefined,
    }))
    .filter((entry) => entry.fr.length > 0 && entry.en.length > 0);
}

export function takeGlossaryTerms(
  entries: readonly GlossaryEntry[] | undefined,
  maxTerms = DEFAULT_MAX_GLOSSARY_TERMS,
): GlossaryEntry[] {
  const normalized = normalizeGlossaryEntries(entries);
  const safeMaxTerms = Number.isFinite(maxTerms)
    ? Math.max(0, Math.floor(maxTerms))
    : DEFAULT_MAX_GLOSSARY_TERMS;

  return normalized.slice(0, safeMaxTerms);
}

export function formatGlossaryForPrompt(
  entries: readonly GlossaryEntry[] | undefined,
): string {
  const normalized = normalizeGlossaryEntries(entries);
  if (!normalized.length) {
    return "No glossary terms provided.";
  }

  return normalized
    .map((entry, index) => {
      const notePart = entry.note ? ` (note: ${entry.note})` : "";
      return `${index + 1}. FR: \"${entry.fr}\" => EN: \"${entry.en}\"${notePart}`;
    })
    .join("\n");
}
