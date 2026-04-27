import Link from "next/link";
import Image from "next/image";
import { formatArticleDate, type Locale } from "@/lib/i18n";
import MetadataRow from "@/components/public/MetadataRow";
import SectionLabel from "@/components/public/SectionLabel";
import {
  formatHeadlineTypography,
  sanitizeExcerptText,
  shouldShowCardExcerpt,
} from "@/lib/content-format";

interface ArticleCardProps {
  article: {
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
  };
  variant?: "default" | "compact" | "list" | "text";
  rank?: number;
  locale?: Locale;
}

export default function ArticleCard({
  article,
  variant = "default",
  rank,
  locale,
}: ArticleCardProps) {
  const resolvedLocale = locale || article.language || "fr";
  const displayTitle = formatHeadlineTypography(article.title);
  const cleanedExcerpt = sanitizeExcerptText(article.excerpt, {
    authorName: article.author?.name,
  });
  const showExcerpt = shouldShowCardExcerpt(article.title, article.excerpt, {
    authorName: article.author?.name,
  });
  const date = article.publishedAt
    ? formatArticleDate(article.publishedAt, resolvedLocale)
    : null;
  const imageSrc = article.coverImageFirebaseUrl || article.coverImage;

  if (variant === "compact") {
    return (
      <Link href={`/${resolvedLocale}/articles/${article.slug}`} className="group block">
        <div className="article-card flex gap-3 items-center border-b border-border-subtle py-4">
          {rank !== undefined && (
            <div className="editorial-numeral shrink-0 w-8 text-center">{String(rank + 1).padStart(2, "0")}</div>
          )}
          {imageSrc && (
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden">
              <Image
                src={imageSrc}
                alt={displayTitle}
                fill
                sizes="160px"
                quality={90}
                className="object-cover transition-opacity duration-300 group-hover:opacity-90"
              />
            </div>
          )}
          <div className="min-w-0">
            {article.contentTypeLabel && (
              <SectionLabel label={article.contentTypeLabel} variant="type" className="mb-2 block" />
            )}
            <h3 className="font-headline text-base font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
              {displayTitle}
            </h3>
            <MetadataRow date={date} className="mt-2" />
          </div>
        </div>
      </Link>
    );
  }

  /* List variant */
  if (variant === "list") {
    return (
      <Link href={`/${resolvedLocale}/articles/${article.slug}`} className="group block">
        <div className="article-card flex flex-col gap-4 border-b border-border-subtle py-6 transition-colors sm:flex-row sm:gap-7">
          {imageSrc && (
            <div className="relative h-44 w-full shrink-0 overflow-hidden bg-surface-elevated sm:h-32 sm:w-48">
              <Image
                src={imageSrc}
                alt={displayTitle}
                fill
                sizes="(min-width: 640px) 384px, 100vw"
                quality={90}
                className="object-cover transition-opacity duration-300 group-hover:opacity-90"
              />
            </div>
          )}
          <div className="flex flex-col justify-center md:pr-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {article.contentTypeLabel && (
                <SectionLabel label={article.contentTypeLabel} variant="kicker" />
              )}
              {article.category && (
                <SectionLabel label={article.category.name} variant="category" />
              )}
            </div>
            <h3 className="font-headline text-xl font-bold leading-tight text-foreground transition-colors group-hover:text-primary sm:text-2xl">
              {displayTitle}
            </h3>
            {showExcerpt && (
              <p className="mt-2 line-clamp-2 font-body text-base leading-relaxed text-muted">
                {cleanedExcerpt}
              </p>
            )}
            <MetadataRow
              author={article.author?.name ? { name: article.author.name, id: article.author?.id } : null}
              date={date}
              readingTime={article.readingTime}
              language={resolvedLocale}
              className="mt-3"
            />
          </div>
        </div>
      </Link>
    );
  }

  /* Text variant — no image, newspaper column style */
  if (variant === "text") {
    return (
      <Link href={`/${resolvedLocale}/articles/${article.slug}`} className="group block h-full">
        <div className="article-card flex h-full flex-col px-0 py-5 sm:px-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {article.category && (
              <SectionLabel label={article.category.name} variant="kicker" />
            )}
            {article.contentTypeLabel && (
              <SectionLabel label={article.contentTypeLabel} variant="type" />
            )}
          </div>
          <h3 className="font-headline text-xl font-bold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-2xl">
            {displayTitle}
          </h3>
          {showExcerpt && (
            <p className="mt-2 line-clamp-3 font-body text-sm leading-relaxed text-muted sm:text-base">
              {cleanedExcerpt}
            </p>
          )}
          <MetadataRow
            author={article.author?.name ? { name: article.author.name, id: article.author?.id } : null}
            date={date}
            readingTime={article.readingTime}
            language={resolvedLocale}
            className="mt-auto pt-4"
          />
        </div>
      </Link>
    );
  }

  /* Default variant */
  return (
    <Link href={`/${resolvedLocale}/articles/${article.slug}`} className="group block h-full">
      <div className="article-card flex h-full flex-col border-b border-border-subtle pb-6">
        {article.category && (
          <p className="page-kicker mb-3" style={{ letterSpacing: "1.2px" }}>
            {article.category.name}
          </p>
        )}
        {imageSrc ? (
          <div className="relative mb-4 aspect-[16/10] overflow-hidden bg-surface-elevated">
            <Image
              src={imageSrc}
              alt={displayTitle}
              fill
              sizes="(min-width: 1024px) 480px, (min-width: 768px) 50vw, 100vw"
              quality={90}
              className="object-cover transition-opacity duration-300 group-hover:opacity-90"
            />
          </div>
        ) : null}
        <h3 className="font-headline text-2xl font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
          {displayTitle}
        </h3>
        {showExcerpt && (
          <p className="mt-3 line-clamp-3 font-body text-base leading-relaxed text-muted">
            {cleanedExcerpt}
          </p>
        )}
        {article.contentTypeLabel && (
          <SectionLabel label={article.contentTypeLabel} variant="type" className="mt-4 block" />
        )}
        <MetadataRow
          author={article.author?.name ? { name: article.author.name, id: article.author?.id } : null}
          date={date}
          readingTime={article.readingTime}
          language={resolvedLocale}
          className="mt-2"
        />
      </div>
    </Link>
  );
}
