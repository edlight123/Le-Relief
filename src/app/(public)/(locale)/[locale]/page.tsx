import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import ArticleCard from "@/components/public/ArticleCard";
import LatestArticlesFeed from "@/components/public/LatestArticlesFeed";
import CategoryGrid from "@/components/public/CategoryGrid";
import NewsletterSignup from "@/components/public/NewsletterSignup";
import MetadataRow from "@/components/public/MetadataRow";
import {
  getHomepageContent,
  type PublicArticle,
  type EditorialLanguage,
} from "@/lib/editorial";
import {
  formatHeadlineTypography,
  sanitizeExcerptText,
  shouldShowCardExcerpt,
} from "@/lib/content-format";
import { formatArticleDate, type Locale } from "@/lib/i18n";
import { validateLocale } from "@/lib/locale";
import {
  buildBreadcrumbJsonLd,
  buildCanonicalAlternates,
  buildMetaDescription,
  buildOgImage,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
  serializeJsonLd,
} from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!validateLocale(locale)) return {};

  const title =
    locale === "fr"
      ? "Le Relief — Média numérique haïtien"
      : "Le Relief — Haitian digital publication";
  const description = buildMetaDescription({
    title,
    excerpt:
      locale === "fr"
        ? "Actualité, analyse, opinion et dossiers d'intérêt public en Haïti et dans la diaspora."
        : "News, analysis, opinion and public-interest reporting on Haiti and its diaspora.",
    locale,
    keyword: locale === "fr" ? "actualité Haïti" : "Haiti news",
    cta:
      locale === "fr"
        ? "Suivez la couverture complète sur Le Relief."
        : "Explore the latest coverage on Le Relief.",
  });

  return {
    title,
    description,
    alternates: buildCanonicalAlternates(`/${locale}`, {
      fr: "/fr",
      en: "/en",
      "x-default": "/fr",
    }),
    openGraph: {
      type: "website",
      locale: locale === "fr" ? "fr_FR" : "en_US",
      url: `/${locale}`,
      title,
      description,
      images: buildOgImage("/logo.png", "Le Relief"),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/logo.png"],
    },
  };
}

/* ──────────────────────────────────────────────────────────── */
/*  Local helpers                                                */
/* ──────────────────────────────────────────────────────────── */

function tt(locale: Locale, fr: string, en: string) {
  return locale === "fr" ? fr : en;
}

function formatLiveTime(value: string | null, locale: Locale) {
  if (!value) return "—";
  const d = new Date(value);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  }
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "short",
  }).format(d);
}

function pickCoverSrc(article: PublicArticle | null | undefined) {
  if (!article) return null;
  return article.coverImageFirebaseUrl || article.coverImage || article.imageSrc || null;
}

/* ──────────────────────────────────────────────────────────── */
/*  Section blocks                                               */
/* ──────────────────────────────────────────────────────────── */

function SectionHeading({
  kicker,
  title,
  href,
  hrefLabel,
}: {
  kicker: string;
  title: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="mb-8 flex items-end justify-between border-b-2 border-foreground pb-3">
      <div>
        <p className="section-kicker mb-2">{kicker}</p>
        <h2 className="font-headline text-3xl font-extrabold leading-none text-foreground sm:text-4xl">
          {title}
        </h2>
      </div>
      {href ? (
        <Link
          href={href}
          className="hidden font-label text-[11px] font-extrabold uppercase tracking-widest text-foreground transition-colors hover:text-primary sm:block"
        >
          {hrefLabel} →
        </Link>
      ) : null}
    </div>
  );
}

function LeadAnalysisColumn({
  articles,
  locale,
}: {
  articles: PublicArticle[];
  locale: Locale;
}) {
  if (articles.length === 0) return null;
  return (
    <div className="lg:col-span-3 lg:border-r lg:border-border-subtle lg:pr-7">
      <h3 className="mb-6 inline-block border-b border-primary pb-1 font-label text-[11px] font-extrabold uppercase tracking-widest text-primary">
        {tt(locale, "Contexte & analyse", "Context & analysis")}
      </h3>
      <div className="space-y-7">
        {articles.map((article, index) => {
          const cleaned = sanitizeExcerptText(article.excerpt, {
            authorName: article.author?.name,
          });
          const showExcerpt = shouldShowCardExcerpt(article.title, article.excerpt, {
            authorName: article.author?.name,
          });
          return (
            <div key={article.id}>
              <Link
                href={`/${locale}/articles/${article.slug}`}
                className="group block"
              >
                {article.category ? (
                  <p className="mb-2 font-label text-[10px] font-extrabold uppercase tracking-widest text-muted">
                    {article.category.name}
                  </p>
                ) : null}
                <h4 className="font-headline text-xl font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                  {formatHeadlineTypography(article.title)}
                </h4>
                {showExcerpt ? (
                  <p className="mt-2 line-clamp-3 font-body text-sm leading-relaxed text-muted">
                    {cleaned}
                  </p>
                ) : null}
              </Link>
              {index < articles.length - 1 ? (
                <div className="mt-7 h-px w-full bg-border-subtle" aria-hidden />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeadHeroColumn({
  article,
  locale,
}: {
  article: PublicArticle | null;
  locale: Locale;
}) {
  if (!article) {
    return (
      <div className="lg:col-span-6 lg:px-7 text-center">
        <p className="section-kicker mb-4 tracking-[0.25em]">
          {tt(locale, "Édition en préparation", "Edition forthcoming")}
        </p>
        <h1 className="editorial-title text-4xl text-foreground sm:text-5xl lg:text-6xl">
          {tt(
            locale,
            "La rédaction prépare la prochaine édition.",
            "The newsroom is preparing the next edition.",
          )}
        </h1>
        <p className="editorial-deck mx-auto mt-6 max-w-xl font-body text-lg sm:text-xl">
          {tt(
            locale,
            "Les articles publiés apparaîtront ici avec leur contexte et leur hiérarchie éditoriale.",
            "Published articles will appear here with their context and editorial hierarchy.",
          )}
        </p>
      </div>
    );
  }

  const imageSrc = pickCoverSrc(article);
  const displayTitle = formatHeadlineTypography(article.title);
  const cleanedExcerpt = sanitizeExcerptText(article.excerpt, {
    authorName: article.author?.name,
  });
  const showExcerpt = shouldShowCardExcerpt(article.title, article.excerpt, {
    authorName: article.author?.name,
  });
  const date = article.publishedAt
    ? formatArticleDate(article.publishedAt, locale)
    : null;

  return (
    <div className="lg:col-span-6 lg:px-7">
      <Link
        href={`/${locale}/articles/${article.slug}`}
        className="group block text-center"
      >
        {article.category ? (
          <p className="mb-4 font-label text-[11px] font-extrabold uppercase tracking-[0.25em] text-primary">
            {article.category.name}
          </p>
        ) : null}
        <h1 className="editorial-title text-4xl text-foreground transition-colors group-hover:text-primary sm:text-5xl lg:text-6xl">
          {displayTitle}
        </h1>
        {imageSrc ? (
          <div className="relative mx-auto mt-7 aspect-[16/9] w-full overflow-hidden border border-border-subtle bg-surface-elevated shadow-[0_20px_40px_-12px_rgba(0,0,0,0.18)]">
            <Image
              src={imageSrc}
              alt={displayTitle}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              priority
            />
          </div>
        ) : null}
        {showExcerpt ? (
          <p className="mt-6 font-headline text-xl italic leading-snug text-muted sm:text-2xl">
            “{cleanedExcerpt}”
          </p>
        ) : null}
        <div className="mt-5 flex items-center justify-center">
          <MetadataRow
            author={
              article.author?.name
                ? { name: article.author.name, id: article.author.id }
                : null
            }
            date={date}
            readingTime={article.readingTime}
            language={article.language as EditorialLanguage}
            bordered
          />
        </div>
      </Link>
    </div>
  );
}

function LiveUpdatesColumn({
  articles,
  locale,
}: {
  articles: PublicArticle[];
  locale: Locale;
}) {
  if (articles.length === 0) return null;
  return (
    <div className="lg:col-span-3 lg:border-l lg:border-border-subtle lg:pl-7">
      <div className="border border-border-subtle bg-surface-newsprint p-5">
        <div className="mb-5 flex items-center gap-3">
          <span className="live-dot" aria-hidden />
          <h3 className="font-label text-[11px] font-extrabold uppercase tracking-widest text-foreground">
            {tt(locale, "En direct", "Live updates")}
          </h3>
        </div>
        <div className="space-y-5">
          {articles.map((article, index) => (
            <div key={article.id}>
              <Link
                href={`/${locale}/articles/${article.slug}`}
                className="group flex gap-3"
              >
                <span className="shrink-0 font-label text-[11px] font-extrabold tracking-wider text-primary">
                  {formatLiveTime(article.publishedAt, locale)}
                </span>
                <div className="min-w-0">
                  {article.category ? (
                    <p className="mb-1 font-label text-[10px] font-bold uppercase tracking-widest text-muted">
                      {article.category.name}
                    </p>
                  ) : null}
                  <p className="font-body text-sm leading-snug text-foreground transition-colors group-hover:text-primary">
                    {formatHeadlineTypography(article.title)}
                  </p>
                </div>
              </Link>
              {index < articles.length - 1 ? (
                <div className="mt-5 h-px w-full bg-border-subtle" aria-hidden />
              ) : null}
            </div>
          ))}
        </div>
        <Link
          href={`/${locale}/categories`}
          className="mt-6 block border border-foreground py-2 text-center font-label text-[11px] font-extrabold uppercase tracking-widest text-foreground transition-colors hover:bg-foreground hover:text-background"
        >
          {tt(locale, "Toutes les actualités", "All updates")}
        </Link>
      </div>
    </div>
  );
}

function ActualitesGrid({
  articles,
  locale,
}: {
  articles: PublicArticle[];
  locale: Locale;
}) {
  if (articles.length === 0) return null;
  const items = articles.slice(0, 4);
  return (
    <section className="newspaper-shell mb-16 sm:mb-24">
      <SectionHeading
        kicker={tt(locale, "Actualités", "News")}
        title={tt(locale, "Les autres titres", "More headlines")}
        href={`/${locale}/categories`}
        hrefLabel={tt(locale, "Tout voir", "Explore all topics")}
      />
      <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-4">
        {items.map((article) => {
          const imageSrc = pickCoverSrc(article);
          const displayTitle = formatHeadlineTypography(article.title);
          const cleaned = sanitizeExcerptText(article.excerpt, {
            authorName: article.author?.name,
          });
          const showExcerpt = shouldShowCardExcerpt(article.title, article.excerpt, {
            authorName: article.author?.name,
          });
          return (
            <Link
              key={article.id}
              href={`/${locale}/articles/${article.slug}`}
              className="group block"
            >
              {imageSrc ? (
                <div className="relative mb-4 aspect-video overflow-hidden bg-surface-elevated">
                  <Image
                    src={imageSrc}
                    alt={displayTitle}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover grayscale transition duration-500 group-hover:grayscale-0 group-hover:scale-[1.02]"
                  />
                </div>
              ) : (
                <div className="mb-4 flex aspect-video items-center justify-center border border-border-subtle bg-surface-newsprint font-label text-[11px] font-bold uppercase text-muted">
                  Le Relief
                </div>
              )}
              <div className="space-y-2">
                <div className="flex justify-between font-label text-[10px] font-extrabold uppercase tracking-widest text-muted">
                  <span>{article.category?.name || article.contentTypeLabel}</span>
                  {article.readingTime ? (
                    <span>
                      {article.readingTime}{" "}
                      {tt(locale, "MIN", "MIN READ")}
                    </span>
                  ) : null}
                </div>
                <h3 className="font-headline text-xl font-bold leading-tight text-foreground transition-colors group-hover:underline">
                  {displayTitle}
                </h3>
                {showExcerpt ? (
                  <p className="line-clamp-2 font-body text-sm leading-relaxed text-muted">
                    {cleaned}
                  </p>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function SundayInterview({
  article,
  locale,
}: {
  article: PublicArticle | null;
  locale: Locale;
}) {
  if (!article) return null;
  const imageSrc = pickCoverSrc(article);
  const displayTitle = formatHeadlineTypography(article.title);
  const cleanedExcerpt = sanitizeExcerptText(article.excerpt, {
    authorName: article.author?.name,
  });
  if (!cleanedExcerpt) return null;
  return (
    <section className="relative mb-16 bg-surface-newsprint py-14 sm:mb-24 sm:py-20">
      <div aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-foreground" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-foreground" />
      <div className="newspaper-shell">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center lg:gap-12">
          {imageSrc ? (
            <div className="lg:col-span-4">
              <div className="relative aspect-[4/5] w-full overflow-hidden border-8 border-background shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
                <Image
                  src={imageSrc}
                  alt={displayTitle}
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          ) : null}
          <div className={imageSrc ? "lg:col-span-8 lg:pl-6" : "lg:col-span-12"}>
            <p className="mb-6 font-label text-[11px] font-extrabold uppercase tracking-[0.3em] text-primary">
              {tt(locale, "Entretien & analyse", "The Sunday Interview")}
            </p>
            <blockquote className="font-headline text-3xl italic leading-tight text-foreground sm:text-4xl lg:text-5xl">
              <span className="pull-quote-glyph" aria-hidden>
                &ldquo;
              </span>
              {cleanedExcerpt}
            </blockquote>
            <h3 className="mt-8 font-headline text-2xl font-bold leading-snug text-foreground sm:text-3xl">
              {displayTitle}
            </h3>
            {article.author?.name ? (
              <p className="mt-2 font-label text-xs font-semibold uppercase tracking-widest text-muted">
                — {article.author.name}
                {article.category ? ` · ${article.category.name}` : ""}
              </p>
            ) : null}
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={`/${locale}/articles/${article.slug}`}
                className="bg-foreground px-7 py-3 font-label text-[11px] font-extrabold uppercase tracking-widest text-background transition-colors hover:bg-primary"
              >
                {tt(locale, "Lire l'entretien", "Read the interview")}
              </Link>
              <Link
                href={`/${locale}/categories`}
                className="border border-foreground px-7 py-3 font-label text-[11px] font-extrabold uppercase tracking-widest text-foreground transition-colors hover:bg-surface-elevated"
              >
                {tt(locale, "Plus d'analyses", "More analysis")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  Page                                                         */
/* ──────────────────────────────────────────────────────────── */

export default async function LocalizedHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!validateLocale(rawLocale)) return null;
  const locale = rawLocale as Locale;

  const {
    hero,
    secondary,
    latest,
    editorial,
    mostRead,
    categories,
    englishSelection,
    showNewsletter,
  } = await getHomepageContent(locale);

  const organizationJsonLd = buildOrganizationJsonLd(locale);
  const websiteJsonLd = buildWebSiteJsonLd(locale);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: tt(locale, "Accueil", "Home"), item: `/${locale}` },
  ]);

  // Pull the analysis column from editorial (fall back to secondary)
  const analysisItems = (editorial.length > 0 ? editorial : secondary).slice(0, 2);
  // Right rail: 3 most recent stories (excluding hero)
  const liveItems = latest
    .filter((a) => !hero || a.id !== hero.id)
    .slice(0, 3);
  // Actualités grid: prefer secondary, then fall back to latest
  const usedIds = new Set<string>([
    ...(hero ? [hero.id] : []),
    ...analysisItems.map((a) => a.id),
    ...liveItems.map((a) => a.id),
  ]);
  const gridSource = secondary.length >= 4 ? secondary : latest;
  const gridItems = gridSource.filter((a) => !usedIds.has(a.id)).slice(0, 4);
  // Sunday interview: pick the best editorial piece with a meaningful excerpt
  const interviewArticle =
    editorial.find((a) => a.excerpt && a.excerpt.length > 60) ||
    editorial[0] ||
    null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />

      {/* ── Lead trio ─────────────────────────────────────── */}
      <section className="newspaper-shell border-b border-border-subtle py-10 sm:py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-7">
          <LeadAnalysisColumn articles={analysisItems} locale={locale} />
          <LeadHeroColumn article={hero} locale={locale} />
          <LiveUpdatesColumn articles={liveItems} locale={locale} />
        </div>
      </section>

      {/* ── Actualités grid ───────────────────────────────── */}
      <div className="pt-12 sm:pt-16">
        <ActualitesGrid articles={gridItems} locale={locale} />
      </div>

      {/* ── Sunday Interview ──────────────────────────────── */}
      <SundayInterview article={interviewArticle} locale={locale} />

      {/* ── Latest feed + sidebar ─────────────────────────── */}
      <div className="newspaper-shell">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12">
          <div className="min-w-0">
            {latest.length > 0 ? (
              <section className="mb-16 sm:mb-20">
                <SectionHeading
                  kicker={tt(locale, "Dernières nouvelles", "Latest")}
                  title={tt(
                    locale,
                    "Le fil de la rédaction",
                    "Latest from the newsroom",
                  )}
                  href={`/${locale}/categories`}
                  hrefLabel={tt(locale, "Toutes les rubriques", "All sections")}
                />
                <LatestArticlesFeed initialArticles={latest} locale={locale} />
              </section>
            ) : null}
          </div>

          <aside className="space-y-10 lg:sticky lg:top-44 lg:h-fit">
            {mostRead.length > 0 ? (
              <section className="border-t-2 border-foreground pt-4">
                <p className="section-kicker mb-2">
                  {tt(locale, "Lecture", "Read")}
                </p>
                <h3 className="mb-5 font-headline text-2xl font-extrabold text-foreground">
                  {tt(locale, "Les plus lus", "Most read")}
                </h3>
                <div className="divide-y divide-border-subtle">
                  {mostRead.map((article, index) => (
                    <Link
                      key={article.id}
                      href={`/${locale}/articles/${article.slug}`}
                      className="group grid grid-cols-[3rem_1fr] gap-3 py-4"
                    >
                      <span
                        className="editorial-numeral"
                        style={{
                          fontSize: "1.75rem",
                          color: "var(--border-subtle)",
                        }}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="font-headline text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                        {formatHeadlineTypography(article.title)}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {categories.length > 0 ? (
              <section className="border-t-2 border-foreground pt-4">
                <div className="mb-5">
                  <p className="section-kicker mb-2">
                    {tt(locale, "Rubriques", "Sections")}
                  </p>
                  <h3 className="font-headline text-2xl font-extrabold text-foreground">
                    {tt(locale, "Parcourir", "Browse")}
                  </h3>
                </div>
                <CategoryGrid categories={categories} locale={locale} />
              </section>
            ) : null}

            {showNewsletter ? (
              <section className="border-t-2 border-foreground pt-4">
                <p className="section-kicker mb-2">
                  {tt(locale, "Lettre", "Newsletter")}
                </p>
                <h3 className="font-headline text-2xl font-extrabold leading-tight text-foreground">
                  {tt(
                    locale,
                    "Recevez les sujets qui comptent.",
                    "Get the stories that matter.",
                  )}
                </h3>
                <div className="mt-5">
                  <NewsletterSignup context="home-sidebar" />
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      </div>

      {/* ── More cards (additional editorial picks) ───────── */}
      {editorial.length > 0 ? (
        <section className="newspaper-shell mt-14 pb-16 sm:mt-20 sm:pb-20">
          <SectionHeading
            kicker={tt(locale, "Contexte", "Perspective")}
            title={tt(
              locale,
              "Analyses, opinions et dossiers",
              "Analysis, opinion and explainers",
            )}
            href={`/${locale}/categories`}
            hrefLabel={tt(locale, "Plus de dossiers", "More features")}
          />
          <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-4">
            {editorial.slice(0, 4).map((article) => (
              <ArticleCard key={article.id} article={article} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Categories taxonomy ───────────────────────────── */}
      {categories.length > 0 ? (
        <section className="newspaper-shell pb-16 sm:pb-20">
          <SectionHeading
            kicker={tt(locale, "Taxonomie", "Taxonomy")}
            title={tt(locale, "Rubriques principales", "Main sections")}
            href={`/${locale}/categories`}
            hrefLabel={tt(locale, "Tout voir", "See all")}
          />
          <CategoryGrid variant="grid" categories={categories} locale={locale} />
        </section>
      ) : null}

      {/* ── English selection (FR only) ───────────────────── */}
      {locale === "fr" && englishSelection.length > 0 ? (
        <section className="newspaper-shell pb-16 sm:pb-20">
          <SectionHeading
            kicker="English"
            title="Selected English coverage"
            href="/en"
            hrefLabel="See all"
          />
          <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-4">
            {englishSelection.map((article) => (
              <ArticleCard key={article.id} article={article} locale="en" />
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Newsletter band ───────────────────────────────── */}
      {showNewsletter ? (
        <section className="mt-12 bg-foreground py-16 sm:mt-20 sm:py-20">
          <div className="newspaper-shell text-center">
            <p className="mb-4 font-label text-[11px] font-extrabold uppercase tracking-[0.3em] text-background/60">
              {tt(locale, "Lettre d'information", "Newsletter")}
            </p>
            <h2 className="font-headline text-3xl font-extrabold leading-tight text-background sm:text-4xl">
              {tt(
                locale,
                "Recevez Le Relief directement.",
                "Get Le Relief, delivered.",
              )}
            </h2>
            <p className="mx-auto mt-4 max-w-md font-body text-base leading-relaxed text-background/70">
              {tt(
                locale,
                "Une sélection éditoriale de l'actualité haïtienne, sans bruit.",
                "An editorial selection of Haitian news, without the noise.",
              )}
            </p>
            <div className="mx-auto mt-8 max-w-sm">
              <NewsletterSignup context="home-hero" />
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
