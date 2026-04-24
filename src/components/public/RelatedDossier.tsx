import ArticleCard from "@/components/public/ArticleCard";
import type { Locale } from "@/lib/i18n";

interface RelatedDossierArticle {
  id?: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  coverImageFirebaseUrl?: string | null;
  publishedAt: Date | string | null;
  author?: { id?: string | null; name: string | null } | null;
  category?: { name: string; slug: string } | null;
  contentTypeLabel?: string;
  readingTime?: number;
  language?: "fr" | "en";
}

interface RelatedDossierProps {
  articles: RelatedDossierArticle[];
  locale?: Locale;
  title?: string;
  kicker?: string;
}

/**
 * "Pour comprendre le dossier" / "To understand the story" — curated related
 * reading designed to feel like an editor's hand-picked package, not an algo
 * dump. Larger headline, stronger framing than a generic "related" rail.
 */
export default function RelatedDossier({
  articles,
  locale = "fr",
  title,
  kicker,
}: RelatedDossierProps) {
  if (articles.length === 0) return null;

  const heading =
    title ||
    (locale === "fr"
      ? "Pour comprendre le dossier"
      : "To understand the story");
  const kickerLabel =
    kicker || (locale === "fr" ? "À lire aussi" : "Continue reading");

  return (
    <section
      className="mt-16 border-t-2 border-border-strong pt-8"
      aria-labelledby="related-dossier-heading"
    >
      <div className="mb-8 max-w-2xl">
        <p className="section-kicker mb-2">{kickerLabel}</p>
        <h2
          id="related-dossier-heading"
          className="font-headline text-3xl font-extrabold leading-tight text-foreground sm:text-4xl"
        >
          {heading}
        </h2>
        <p className="mt-3 font-body text-base leading-relaxed text-muted">
          {locale === "fr"
            ? "Une sélection éditoriale pour replacer ce sujet dans son contexte."
            : "An editorial selection to place this story in context."}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-4">
        {articles.map((article) => (
          <ArticleCard
            key={article.slug}
            article={article}
            locale={locale}
          />
        ))}
      </div>
    </section>
  );
}
