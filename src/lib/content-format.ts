function normalizeForComparison(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function formatHeadlineTypography(input: string) {
  return input.replace(/\s+([:;!?])/g, "\u00A0$1");
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
