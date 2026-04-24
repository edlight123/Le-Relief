function normalizeForComparison(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Apply editorial smart-typography rules to a headline or short text.
 * - Non-breaking space before French high punctuation (: ; ! ? »).
 * - Smart quotes: « … » in FR, “…” in EN.
 * - En-dash for digit ranges (e.g. 2024-2026 → 2024–2026).
 * - Three dots → ellipsis character.
 */
export function formatHeadlineTypography(
  input: string,
  locale: "fr" | "en" = "fr",
) {
  let out = input;

  // Ellipsis
  out = out.replace(/\.{3,}/g, "\u2026");

  // En-dash for digit ranges (e.g. "1990-2010")
  out = out.replace(/(\d)\s*-\s*(\d)/g, "$1\u2013$2");

  // Smart quotes
  if (locale === "fr") {
    // "text" → « text » (only when paired)
    out = out.replace(/"([^"]+)"/g, "\u00ab\u00a0$1\u00a0\u00bb");
    // Apostrophe l' d' n' s' → ’
    out = out.replace(/([A-Za-z\u00C0-\u017F])'([A-Za-z\u00C0-\u017F])/g, "$1\u2019$2");
  } else {
    out = out
      .replace(/(^|[\s(\[])"/g, "$1\u201c")
      .replace(/"/g, "\u201d")
      .replace(/(^|[\s(\[])'/g, "$1\u2018")
      .replace(/'/g, "\u2019");
  }

  // FR rule: non-breaking space before : ; ! ? and before » / after «
  if (locale === "fr") {
    out = out.replace(/\s+([:;!?])/g, "\u00A0$1");
    out = out.replace(/\s+»/g, "\u00A0»");
    out = out.replace(/«\s+/g, "«\u00A0");
  } else {
    // EN: only thin space before — (em dash) optional; otherwise leave
    out = out.replace(/\s+([:;!?])/g, "\u00A0$1");
  }

  return out;
}

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function sanitizeExcerptText(
  input: string | null | undefined,
  options?: { authorName?: string | null },
) {
  if (!input) return "";

  const hadTrailingTruncationMarker = /(?:\[\s*…\s*\]|\[\s*\.\.\.\s*\]|…)\s*$/u.test(input);
  const normalizedAuthor = options?.authorName?.trim();

  let cleaned = input
    .replace(/<[^>]*>/g, " ")
    .replace(/^\s*(par|by)\s+(la rédaction|l[ae] redaction|newsroom|staff)\s*/iu, "")
    .replace(
      /^\s*(par|by)\s+[A-ZÀ-ÖØ-öø-ÿ][\p{L}'’-]+(?:\s+[A-ZÀ-ÖØ-öø-ÿ][\p{L}'’-]+){0,2}?\s+(?=(la|le|l[’']|les|un|une|des|du|de|ce|cette|ces|the|this|these|a|an)\b)/iu,
      "",
    )
    .replace(/(?:\[\s*…\s*\]|\[\s*\.\.\.\s*\]|…)\s*$/u, "")
    .replace(/\s+/g, " ")
    .trim();

  if (normalizedAuthor) {
    const authorPattern = escapeRegExp(normalizedAuthor).replace(/\s+/g, "\\s+");
    cleaned = cleaned
      .replace(new RegExp(`^\\s*(par|by)\\s+${authorPattern}\\s*`, "iu"), "")
      .trim();
  }

  if (hadTrailingTruncationMarker) {
    const lastTerminalPunctuation = Math.max(
      cleaned.lastIndexOf("."),
      cleaned.lastIndexOf("!"),
      cleaned.lastIndexOf("?"),
    );

    if (lastTerminalPunctuation >= 40) {
      cleaned = cleaned.slice(0, lastTerminalPunctuation + 1).trim();
    }
  }

  return cleaned;
}

export function shouldShowCardExcerpt(
  title: string,
  excerpt: string | null | undefined,
  options?: { authorName?: string | null },
) {
  const cleanedExcerpt = sanitizeExcerptText(excerpt, options);
  if (!cleanedExcerpt) return false;

  const normalizedTitle = normalizeForComparison(title);
  const normalizedExcerpt = normalizeForComparison(cleanedExcerpt);

  if (!normalizedTitle || !normalizedExcerpt) return true;
  if (normalizedTitle === normalizedExcerpt) return false;

  return !(normalizedExcerpt.length > 40 && normalizedExcerpt.startsWith(normalizedTitle));
}
