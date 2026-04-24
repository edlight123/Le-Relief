import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { formatArticleDate } from "@/lib/i18n";
import {
  formatHeadlineTypography,
  sanitizeExcerptText,
  shouldShowCardExcerpt,
} from "@/lib/content-format";

interface CompactArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: Date | string | null;
  category?: { name: string; slug: string } | null;
  author?: { name: string | null } | null;
  readingTime?: number;
  language?: "fr" | "en";
}

interface CompactArticleListProps {
  articles: CompactArticle[];
  locale?: Locale;
  showExcerpt?: boolean;
}

/**
 * Compact text-first list optimized for "latest news" / wire-style readability.
 * No images — typographic hierarchy carries the section.
 */
export default function CompactArticleList({
  articles,
  locale = "fr",
  showExcerpt = true,
}: CompactArticleListProps) {
  if (articles.length === 0) return null;

  return (
    <ul className="divide-y divide-border-subtle border-y border-border-subtle">
      {articles.map((article) => {
        const excerpt = sanitizeExcerptText(article.excerpt, {
          authorName: article.author?.name,
        });
        const renderExcerpt =
          showExcerpt &&
          shouldShowCardExcerpt(article.title, article.excerpt, {
            authorName: article.author?.name,
          });
        const date = article.publishedAt
          ? formatArticleDate(article.publishedAt, locale)
          : null;

        return (
          <li key={article.id}>
            <Link
              href={`/${locale}/articles/${article.slug}`}
              className="group block py-5"
            >
              <div className="mb-2 flex flex-wrap items-center gap-3 font-label text-[10px] font-extrabold uppercase tracking-[1.2px]">
                {article.category ? (
                  <span className="text-primary">{article.category.name}</span>
                ) : null}
                {date ? (
                  <span className="font-[family-name:var(--font-mono)] text-muted">
                    {date}
                  </span>
                ) : null}
                {article.readingTime ? (
                  <span className="font-[family-name:var(--font-mono)] text-muted">
                    {article.readingTime}{" "}
                    {locale === "fr" ? "min de lecture" : "min read"}
                  </span>
                ) : null}
              </div>
              <h3 className="font-headline text-xl font-bold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-[1.4rem]">
                {formatHeadlineTypography(article.title)}
              </h3>
              {renderExcerpt ? (
                <p className="mt-2 line-clamp-2 font-body text-base leading-relaxed text-muted">
                  {excerpt}
                </p>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
