import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { formatHeadlineTypography } from "@/lib/content-format";

interface MostReadArticle {
  id: string;
  title: string;
  slug: string;
  category?: { name: string; slug: string } | null;
}

interface MostReadListProps {
  articles: MostReadArticle[];
  locale?: Locale;
  title?: string;
  kicker?: string;
}

/**
 * Premium numbered "most read" ranking — compact, typographic, no images.
 */
export default function MostReadList({
  articles,
  locale = "fr",
  title,
  kicker,
}: MostReadListProps) {
  if (articles.length === 0) return null;

  const heading = title || (locale === "fr" ? "Les plus lus" : "Most read");
  const kickerLabel = kicker || (locale === "fr" ? "Popularité" : "Popular");

  return (
    <section aria-labelledby="most-read-heading">
      <p className="section-kicker mb-2">{kickerLabel}</p>
      <h3
        id="most-read-heading"
        className="mb-5 font-headline text-2xl font-extrabold leading-none text-foreground"
      >
        {heading}
      </h3>
      <ol className="divide-y divide-border-subtle">
        {articles.map((article, index) => (
          <li key={article.id}>
            <Link
              href={`/${locale}/articles/${article.slug}`}
              className="group grid grid-cols-[2.25rem_1fr] items-baseline gap-4 py-4"
            >
              <span
                className="editorial-numeral"
                style={{
                  fontSize: "1.65rem",
                  color: "var(--border-subtle)",
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                {article.category ? (
                  <span className="mb-1 block font-label text-[10px] font-extrabold uppercase tracking-[1.2px] text-primary">
                    {article.category.name}
                  </span>
                ) : null}
                <span className="font-headline text-[1.05rem] font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                  {formatHeadlineTypography(article.title)}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
