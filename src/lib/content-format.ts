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

export function sanitizeExcerptText(input: string | null | undefined) {
  if (!input) return "";

  return input
    .replace(/<[^>]*>/g, " ")
    .replace(
      /^\s*(par|by)\s+(la rédaction|l[ae] redaction|newsroom|staff|[A-ZÀ-ÖØ-öø-ÿ][\p{L}'’-]+(?:\s+[A-ZÀ-ÖØ-öø-ÿ][\p{L}'’-]+){0,3})\s*/iu,
      "",
    )
    .replace(/(?:\[\s*…\s*\]|\[\s*\.\.\.\s*\]|…)\s*$/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function shouldShowCardExcerpt(
  title: string,
  excerpt: string | null | undefined,
) {
  const cleanedExcerpt = sanitizeExcerptText(excerpt);
  if (!cleanedExcerpt) return false;

  const normalizedTitle = normalizeForComparison(title);
  const normalizedExcerpt = normalizeForComparison(cleanedExcerpt);

  if (!normalizedTitle || !normalizedExcerpt) return true;
  if (normalizedTitle === normalizedExcerpt) return false;

  return !(normalizedExcerpt.length > 40 && normalizedExcerpt.startsWith(normalizedTitle));
}
