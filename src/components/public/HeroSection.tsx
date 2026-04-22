import Link from "next/link";
import Image from "next/image";
import { type Locale, t } from "@/lib/i18n";
import {
  formatHeadlineTypography,
  sanitizeExcerptText,
  shouldShowCardExcerpt,
} from "@/lib/content-format";

interface HeroSectionProps {
  article?: {
    title: string;
    slug: string;
    excerpt: string | null;
    coverImage: string | null;
    coverImageFirebaseUrl?: string | null;
    category?: { name: string; slug: string } | null;
    author?: { name: string | null } | null;
    publishedAt?: Date | string | null;
    contentTypeLabel?: string;
    readingTime?: number;
    language?: "fr" | "en";
  };
  locale?: Locale;
}

export default function HeroSection({ article, locale }: HeroSectionProps) {
  const resolvedLocale = locale || article?.language || "fr";
  if (!article) {
    return (
      <section className="newspaper-shell py-10 sm:py-14">
        <div className="border-t-2 border-border-strong py-10 text-center sm:py-14">
          <p className="page-kicker mb-5" style={{ letterSpacing: "1.2px" }}>Journalisme indépendant</p>
          <h1 className="editorial-title mx-auto max-w-4xl text-5xl text-foreground sm:text-7xl md:text-8xl tracking-tight sm:tracking-[-0.5px] md:tracking-[-1px]">
            Le Relief Haïti
          </h1>
          <p className="editorial-deck mx-auto mt-6 max-w-2xl font-body text-xl sm:text-2xl">
            Une publication numérique haïtienne pour lire l&apos;actualité avec contexte,
            méthode et responsabilité éditoriale.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={`/${resolvedLocale}/categories`}
              className="border border-border-strong bg-foreground px-6 py-3 font-label text-xs font-extrabold uppercase text-background transition-colors hover:bg-primary hover:text-white"
            >
              {resolvedLocale === "fr" ? "Explorer les articles" : "Explore articles"}
            </Link>
            <Link
              href={`/${resolvedLocale}/about`}
              className="border border-border-strong px-6 py-3 font-label text-xs font-extrabold uppercase text-foreground transition-colors hover:bg-surface-elevated"
            >
              {resolvedLocale === "fr" ? "En savoir plus" : "Learn more"}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const imageSrc = article.coverImageFirebaseUrl || article.coverImage;
  const displayTitle = formatHeadlineTypography(article.title);
  const cleanedExcerpt = sanitizeExcerptText(article.excerpt);
  const showExcerpt = shouldShowCardExcerpt(article.title, article.excerpt);
  const date = article.publishedAt
    ? new Intl.DateTimeFormat(resolvedLocale === "fr" ? "fr-FR" : "en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(article.publishedAt))
    : null;

  const meta = (
    <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border-subtle pt-4 font-label text-[11px] font-bold uppercase text-muted tracking-[1px]">
      {article.author?.name && <span>{t(resolvedLocale, "by")} {article.author.name}</span>}
      {article.author?.name && date && <span className="text-border-subtle">/</span>}
      {date && <span>{date}</span>}
      {article.readingTime ? (
        <>
          <span className="text-border-subtle">/</span>
          <span>{article.readingTime} {t(resolvedLocale, "minRead")}</span>
        </>
      ) : null}
    </div>
  );

  /* No cover image — full-width editorial layout */
  if (!imageSrc) {
    return (
      <section className="newspaper-shell py-6 sm:py-10">
        <Link href={`/${resolvedLocale}/articles/${article.slug}`} className="group block">
          <div className="border-t-2 border-border-strong pt-5">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <p className="font-label text-[11px] font-bold uppercase text-muted">À la une</p>
              {article.category && (
                <p className="page-kicker" style={{ letterSpacing: "1.2px" }}>{article.category.name}</p>
              )}
            </div>
            <div className="py-8 sm:py-12">
              {article.contentTypeLabel && (
                <p className="mb-4 font-label text-xs font-extrabold uppercase text-muted">
                  {article.contentTypeLabel}
                  {article.language === "en" ? " / English" : ""}
                </p>
              )}
              <h1 className="editorial-title max-w-5xl text-4xl text-foreground transition-colors group-hover:text-primary sm:text-5xl lg:text-7xl xl:text-8xl tracking-tight lg:tracking-[-1px]">
                {displayTitle}
              </h1>
              {showExcerpt && (
                <p className="editorial-deck mt-5 max-w-3xl font-body text-xl sm:text-2xl">
                  {cleanedExcerpt}
                </p>
              )}
              {meta}
            </div>
          </div>
        </Link>
      </section>
    );
  }

  /* With cover image — 2-column, text bottom-aligned */
  return (
    <section className="newspaper-shell py-6 sm:py-10">
      <Link href={`/${resolvedLocale}/articles/${article.slug}`} className="group block">
        <div className="border-t-2 border-border-strong pt-5">
          <div className="grid gap-0 lg:grid-cols-[1fr_1.4fr]">

            {/* Text column — bottom-aligned */}
            <div className="order-2 flex flex-col justify-end border-t border-border-subtle pb-1 pt-5 lg:order-1 lg:border-r lg:border-t-0 lg:pb-0 lg:pr-8 lg:pt-0">
              <div>
                <div className="mb-5 flex items-center gap-3">
                  {article.category && (
                    <p className="page-kicker" style={{ letterSpacing: "1.2px" }}>{article.category.name}</p>
                  )}
                  {article.contentTypeLabel && (
                    <p className="font-label text-[11px] font-extrabold uppercase text-muted">
                      {article.contentTypeLabel}
                      {article.language === "en" ? " / English" : ""}
                    </p>
                  )}
                </div>
                <h1 className="editorial-title text-3xl text-foreground transition-colors group-hover:text-primary sm:text-4xl lg:text-6xl tracking-tight lg:tracking-[-0.5px]">
                  {displayTitle}
                </h1>
                {showExcerpt && (
                  <p className="editorial-deck mt-5 font-body text-lg sm:text-xl">
                    {cleanedExcerpt}
                  </p>
                )}
                {meta}
              </div>
            </div>

            {/* Image column */}
            <div className="order-1 lg:order-2">
              <div className="relative aspect-[16/10] overflow-hidden bg-surface-elevated">
                <Image
                  src={imageSrc}
                  alt={displayTitle}
                  fill
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  priority
                />
              </div>
              <p className="mt-2 border-b border-border-subtle pb-3 font-label text-[11px] uppercase text-muted">
                À la une
              </p>
            </div>

          </div>
        </div>
      </Link>
    </section>
  );
}
