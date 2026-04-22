import "dotenv/config";
import { getHomepageContent } from "@/lib/editorial";
import { sanitizeExcerptText } from "@/lib/content-format";

function scoreIssue(raw: string | null, authorName?: string | null) {
  if (!raw) return { hasIssue: false, reason: "none" };
  const trimmed = raw.trim();
  const hasTrailingMarker = /(?:\[\s*…\s*\]|\[\s*\.\.\.\s*\]|…)\s*$/u.test(trimmed);
  const hasBylinePrefix = /^\s*(par|by)\s+/iu.test(trimmed);
  const cleaned = sanitizeExcerptText(trimmed, { authorName });
  const endsCleanly = /[.!?]$/.test(cleaned);
  const hasIssue = hasTrailingMarker || hasBylinePrefix || (!endsCleanly && cleaned.length > 120);
  const reason = hasTrailingMarker
    ? "truncation-marker"
    : hasBylinePrefix
      ? "byline-prefix"
      : !endsCleanly && cleaned.length > 120
        ? "unfinished-ending"
        : "ok";
  return { hasIssue, reason, cleaned };
}

async function auditLocale(locale: "fr" | "en") {
  const home = await getHomepageContent(locale);
  const sections = [
    ["hero", home.hero ? [home.hero] : []],
    ["secondary", home.secondary],
    ["latest", home.latest],
    ["editorial", home.editorial],
    ["mostRead", home.mostRead],
    ["englishSelection", home.englishSelection],
  ] as const;

  console.log(`\n=== ${locale.toUpperCase()} HOMEPAGE EXCERPT AUDIT ===`);
  for (const [section, list] of sections) {
    for (const article of list) {
      const rawExcerpt = article.excerpt || null;
      const { hasIssue, reason, cleaned } = scoreIssue(rawExcerpt, article.author?.name);
      if (!hasIssue) continue;
      console.log(`- [${section}] ${article.slug}`);
      console.log(`  author: ${JSON.stringify(article.author?.name ?? null)}`);
      console.log(`  reason: ${reason}`);
      console.log(`  raw: ${JSON.stringify(rawExcerpt)}`);
      console.log(`  cleaned: ${JSON.stringify(cleaned)}`);
    }
  }
}

async function main() {
  await auditLocale("fr");
  await auditLocale("en");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
