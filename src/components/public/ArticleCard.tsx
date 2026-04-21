import Link from "next/link";
import Image from "next/image";
import { formatArticleDate, type Locale, t } from "@/lib/i18n";

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
                alt={article.title}
                fill
                sizes="80px"
                className="object-cover grayscale transition duration-300 group-hover:grayscale-0"
              />
            </div>
          )}
          <div className="min-w-0">
            {article.contentTypeLabel && (
              <p className="mb-2 font-label text-[11px] font-extrabold uppercase text-primary">
                {article.contentTypeLabel}
              </p>
            )}
            <h3 className="font-headline text-base font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
              {article.title}
            </h3>
            {date && (
              <p className="mt-2 font-[family-name:var(--font-mono)] text-[11px] font-bold uppercase text-muted tracking-[1px]">{date}</p>
            )}
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
                alt={article.title}
                fill
                sizes="(min-width: 640px) 192px, 100vw"
                className="object-cover grayscale transition duration-300 group-hover:grayscale-0"
              />
            </div>
          )}
          <div className="flex flex-col justify-center md:pr-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {article.contentTypeLabel && (
                <span className="page-kicker">{article.contentTypeLabel}</span>
              )}
              {article.category && (
                <span className="font-label text-[11px] font-bold uppercase text-muted tracking-[1px]">
                  {article.category.name}
                </span>
              )}
              {article.language === "en" && (
                <span className="font-label text-[11px] font-bold uppercase text-primary tracking-[1px]">
                  English
                </span>
              )}
              {date && (
                <span className="font-[family-name:var(--font-mono)] text-[11px] font-bold uppercase text-muted tracking-[1px]">{date}</span>
              )}
              {article.readingTime ? (
                <span className="font-[family-name:var(--font-mono)] text-[11px] font-bold uppercase text-muted tracking-[1px]">
                  {article.readingTime} min
                </span>
              ) : null}
            </div>
            <h3 className="font-headline text-xl font-bold leading-tight text-foreground transition-colors group-hover:text-primary sm:text-2xl">
              {article.title}
            </h3>
            {article.excerpt && (
              <p className="mt-2 line-clamp-2 font-body text-base leading-relaxed text-muted">
                {article.excerpt}
              </p>
            )}
            {article.author?.name && (
              <p className="mt-3 font-label text-[11px] font-bold uppercase text-muted tracking-[1px]">
                {t(resolvedLocale, "by")} {article.author.name}
              </p>
            )}
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
              <span className="page-kicker tracking-[1px]">{article.category.name}</span>
            )}
            {article.contentTypeLabel && (
              <span className="font-label text-[11px] font-extrabold uppercase text-muted tracking-[1px]">
                {article.contentTypeLabel}
              </span>
            )}
          </div>
          <h3 className="font-headline text-xl font-bold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-2xl">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="mt-2 line-clamp-3 font-body text-sm leading-relaxed text-muted sm:text-base">
              {article.excerpt}
            </p>
          )}
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-4 font-label text-[11px] font-bold uppercase text-muted">
            {article.author?.name && <span className="tracking-[1px]">{article.author.name}</span>}
            {article.author?.name && date && <span className="text-border-subtle">/</span>}
            {date && <span className="font-[family-name:var(--font-mono)] tracking-[1px]">{date}</span>}
            {article.readingTime ? (
              <>
                <span className="text-border-subtle">/</span>
                <span className="font-[family-name:var(--font-mono)] tracking-[1px]">{article.readingTime} min</span>
              </>
            ) : null}
          </div>
        </div>
      </Link>
    );
  }

  /* Default variant */
  return (
    <Link href={`/${resolvedLocale}/articles/${article.slug}`} className="group block h-full">
      <div className="article-card flex h-full flex-col border-b border-border-subtle pb-6">
        <div className="relative mb-4 aspect-[16/10] overflow-hidden bg-surface-elevated">
          {imageSrc ? (
            <>
              <Image
                src={imageSrc}
                alt={article.title}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                className="object-cover grayscale transition duration-300 group-hover:grayscale-0"
              />
              {article.category && (
                <span className="absolute left-0 top-0 bg-foreground px-3 py-1 font-label text-[11px] font-bold uppercase text-background tracking-[1px]">
                  {article.category.name}
                </span>
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center border border-border-subtle bg-surface-newsprint">
              {article.category && (
                <span className="absolute left-0 top-0 bg-foreground px-3 py-1 font-label text-[11px] font-bold uppercase text-background tracking-[1px]">
                  {article.category.name}
                </span>
              )}
              <span className="font-label text-xs font-bold uppercase text-muted">Le Relief</span>
            </div>
          )}
        </div>
        <h3 className="font-headline text-2xl font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="mt-3 line-clamp-3 font-body text-base leading-relaxed text-muted">
            {article.excerpt}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2 font-label text-[11px] font-bold uppercase text-muted">
          {article.contentTypeLabel && <span className="tracking-[1px]">{article.contentTypeLabel}</span>}
          {article.contentTypeLabel && (article.author?.name || date) && (
            <span className="text-border-subtle">/</span>
          )}
          {article.author?.name && <span className="tracking-[1px]">{article.author.name}</span>}
          {article.author?.name && date && (
            <span className="text-border-subtle">/</span>
          )}
          {date && <span className="font-[family-name:var(--font-mono)] tracking-[1px]">{date}</span>}
          {article.readingTime ? (
            <>
              <span className="text-border-subtle">/</span>
              <span className="font-[family-name:var(--font-mono)] tracking-[1px]">{article.readingTime} min</span>
            </>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
