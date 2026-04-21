import ArticleCard from "@/components/public/ArticleCard";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

interface RelatedArticlesProps {
  articles: {
    title: string;
    slug: string;
    excerpt: string | null;
    coverImage: string | null;
    coverImageFirebaseUrl?: string | null;
    publishedAt: Date | string | null;
    author?: { name: string | null } | null;
    category?: { name: string; slug: string } | null;
  }[];
  compact?: boolean;
  locale?: Locale;
}

export default function RelatedArticles({ articles, compact = false, locale = "fr" }: RelatedArticlesProps) {
  if (articles.length === 0) return null;

  const regionTitle = compact ? t(locale, "relatedKicker") : t(locale, "relatedTitle");
  const sectionId = compact ? "related-articles-compact" : "related-articles";

  if (compact) {
    return (
      <section aria-labelledby={sectionId}>
        <h3 id={sectionId} className="mb-3 font-label text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
          {regionTitle}
        </h3>
        <div className="divide-y divide-border-subtle">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} variant="compact" locale={locale} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mt-16 border-t-2 border-border-strong pt-8" aria-labelledby={sectionId}>
      <div className="mb-8">
        <p className="section-kicker mb-2">{t(locale, "relatedKicker")}</p>
        <h2 id={sectionId} className="font-headline text-3xl font-extrabold text-foreground">{regionTitle}</h2>
      </div>
      <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-4">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} locale={locale} />
        ))}
      </div>
    </section>
  );
}
