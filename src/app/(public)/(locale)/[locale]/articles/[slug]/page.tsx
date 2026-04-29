import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { format, differenceInHours } from "date-fns";
import { enUS, fr } from "date-fns/locale";
import NewsletterSignup from "@/components/public/NewsletterSignup";
import Breadcrumb from "@/components/public/Breadcrumb";
import ReadingProgress from "@/components/public/ReadingProgress";
import ArticleShareButtons from "@/components/public/ArticleShareButtons";
import TableOfContents from "@/components/public/TableOfContents";
import ArticleViewTracker from "@/components/public/ArticleViewTracker";
import AITranslationNotice from "@/components/public/AITranslationNotice";
import ArticleKeyPoints from "@/components/public/ArticleKeyPoints";
import ArticleContextBox from "@/components/public/ArticleContextBox";
import SourceAttribution from "@/components/public/SourceAttribution";
import RelatedDossier from "@/components/public/RelatedDossier";
import ArticlePrevNext from "@/components/public/ArticlePrevNext";
import { siteConfig } from "@/config/site.config";
import { getPublicArticleBySlug, getRelatedArticles } from "@/lib/editorial";
import * as articlesRepo from "@/lib/repositories/articles";
import { validateLocale } from "@/lib/locale";
import { hrefForLocale } from "@/lib/locale-routing";
import {
  buildArticleImageAlt,
  buildBreadcrumbJsonLd,
  buildCanonicalAlternates,
  buildEditorialOgImage,
  buildMetaDescription,
  buildNewsArticleJsonLd,
  buildRobotsDirective,
  serializeJsonLd,
} from "@/lib/seo";

export const revalidate = 300;

function stripHtml(input: string) {
  return input.replace(/<[^>]*>/g, " ");
}

function formatHeadlineTypography(input: string) {
  return input.replace(/\s+([:;!?])/g, "\u00A0$1");
}

function sanitizeDeckText(input: string) {
  return input
    .replace(
      /^\s*(par|by)\s+(la rédaction|l[ae] redaction|newsroom|staff|[A-ZÀ-ÖØ-öø-ÿ][\p{L}'’-]+(?:\s+[A-ZÀ-ÖØ-öø-ÿ][\p{L}'’-]+){0,3})\s*/iu,
      "",
    )
    .replace(/(?:\[\s*…\s*\]|\[\s*\.\.\.\s*\]|…)\s*$/u, "")
    .trim();
}

function normalizeForComparison(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isDuplicateIntro(deckText: string, firstBodyParagraph: string) {
  const deck = normalizeForComparison(deckText);
  const first = normalizeForComparison(firstBodyParagraph);
  if (!deck || !first) return false;
  if (deck === first) return true;

  const prefixLength = 180;
  const deckPrefix = deck.slice(0, prefixLength).trim();
  const firstPrefix = first.slice(0, prefixLength).trim();

  return (
    (deckPrefix.length > 40 && first.startsWith(deckPrefix)) ||
    (firstPrefix.length > 40 && deck.startsWith(firstPrefix))
  );
}

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  if (!validateLocale(locale)) return {};

  const article = await getPublicArticleBySlug(slug, locale);
  if (!article) return {};

  const title = `${article.title} | Le Relief`;
  const description = buildMetaDescription({
    title,
    excerpt: article.excerpt || article.subtitle,
    body: article.body,
    locale,
    keyword: article.category?.name || article.title,
    cta:
      locale === "fr"
        ? "Consultez l'article complet sur Le Relief."
        : "Read the full story on Le Relief.",
  });
  const alternateLocale = locale === "fr" ? "en" : "fr";
  const alternatePath = article.alternateLanguageSlug
    ? `/${alternateLocale}/articles/${article.alternateLanguageSlug}`
    : undefined;
  const defaultPath =
    locale === "fr"
      ? `/${locale}/articles/${slug}`
      : article.alternateLanguageSlug
        ? `/fr/articles/${article.alternateLanguageSlug}`
        : `/${locale}/articles/${slug}`;

  return {
    title,
    description,
    alternates: buildCanonicalAlternates(`/${locale}/articles/${slug}`, {
      [locale]: `/${locale}/articles/${slug}`,
      [alternateLocale]: alternatePath,
      "x-default": defaultPath,
    }),
    robots: buildRobotsDirective(article.status),
    openGraph: {
      type: "article",
      locale: locale === "fr" ? "fr_FR" : "en_US",
      url: `${siteConfig.url}/${locale}/articles/${slug}`,
      siteName: siteConfig.name,
      title,
      description,
      images: buildEditorialOgImage({
        title: article.title,
        category: article.category?.name,
        author: article.author?.name,
        date: article.publishedAt
          ? new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(new Date(article.publishedAt))
          : null,
        locale,
        alt: article.title,
      }),
      publishedTime: article.publishedAt || undefined,
      modifiedTime: article.updatedAt || undefined,
      section: article.category?.name,
      authors: article.author?.name ? [article.author.name] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: article.imageSrc
        ? [article.imageSrc]
        : buildEditorialOgImage({
            title: article.title,
            category: article.category?.name,
            author: article.author?.name,
            locale,
          }).map((i) => i.url),
    },
  };
}

export default async function LocalizedArticlePage({ params }: Props) {
  const { slug, locale } = await params;
  if (!validateLocale(locale)) notFound();

  const article = await getPublicArticleBySlug(slug, locale);
  if (!article) notFound();

  try {
    await articlesRepo.incrementViews(article.id);
  } catch {
    // no-op
  }

  const [related, adjacent] = await Promise.all([
    getRelatedArticles(article, 4, locale),
    article.publishedAt
      ? articlesRepo.getAdjacentArticles(article.publishedAt, locale).catch(() => ({ prev: null, next: null }))
      : Promise.resolve({ prev: null, next: null }),
  ]);
  const bodyHasHtml = /<\/?[a-z][\s\S]*>/i.test(article.body);
  const firstBodyParagraph = (bodyHasHtml ? stripHtml(article.body) : article.body)
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .find(Boolean) || "";
  const deckText = sanitizeDeckText(article.subtitle || article.excerpt || "");
  const shouldShowDeck = Boolean(deckText) && !isDuplicateIntro(deckText, firstBodyParagraph);
  const displayTitle = formatHeadlineTypography(article.title);
  const articleUrl = `${siteConfig.url}/${locale}/articles/${slug}`;
  const alternateLabel = locale === "fr" ? "Lire en anglais" : "Read in French";
  const articleJsonLd = buildNewsArticleJsonLd({
    headline: article.title,
    description: article.excerpt || article.subtitle || article.title,
    url: `/${locale}/articles/${slug}`,
    image: article.imageSrc,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    locale,
    section: article.category?.name,
    authorName: article.author?.name,
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: locale === "fr" ? "Accueil" : "Home", item: `/${locale}` },
    article.category
      ? { name: article.category.name, item: `/${locale}/categories/${article.category.slug}` }
      : { name: locale === "fr" ? "Articles" : "Articles", item: `/${locale}/categories` },
    { name: article.title, item: `/${locale}/articles/${slug}` },
  ]);

  const wasUpdated =
    article.updatedAt &&
    article.publishedAt &&
    differenceInHours(new Date(article.updatedAt), new Date(article.publishedAt)) > 1;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <ArticleViewTracker
        articleId={article.id}
        title={article.title}
        slug={slug}
        language={locale as "fr" | "en"}
        locale={locale as "fr" | "en"}
        category={article.category?.name}
        categoryId={article.category?.id}
        readingTime={article.readingTime}
      />
      <ReadingProgress />
      <article className="newspaper-shell py-6 sm:py-10 animate-fade-in" data-print-hide="false">
        <Breadcrumb
          locale={locale}
          crumbs={[
            { label: locale === "fr" ? "Accueil" : "Home", href: "/" },
            ...(article.category
              ? [
                  {
                    label: article.category.name,
                    href: `/categories/${article.category.slug}`,
                  },
                ]
              : [
                  {
                    label: locale === "fr" ? "Articles" : "Articles",
                    href: "/categories",
                  },
                ]),
            { label: article.title },
          ]}
        />

        <header className="border-t-2 border-border-strong pt-4">
          <div className="flex flex-wrap items-center gap-3 font-label text-xs font-extrabold uppercase">
            {article.category ? (
              <Link
                href={hrefForLocale(`/categories/${article.category.slug}`, locale)}
                className="text-primary transition-colors hover:text-foreground"
              >
                {article.category.name}
              </Link>
            ) : null}
            {article.contentTypeLabel ? (
              <span className="text-muted">{article.contentTypeLabel}</span>
            ) : null}
          </div>

          <h1 className="editorial-title mt-3 max-w-5xl text-4xl text-foreground sm:text-5xl lg:text-6xl">
            {article.isBreaking && (
              <span className="mb-3 inline-flex items-center bg-red-600 px-2 py-0.5 font-label text-sm font-extrabold uppercase tracking-wider text-white align-middle mr-3">
                {locale === "en" ? "Breaking" : "Urgent"}
              </span>
            )}
            {displayTitle}
          </h1>

          {shouldShowDeck ? (
            <p className="editorial-deck mt-4 max-w-3xl font-body text-2xl">
              {deckText}
            </p>
          ) : null}

          <p className="editorial-dateline mt-5 border-y border-border-subtle py-3">
            {article.author ? (
              <>
                {locale === "fr" ? "Par " : "By "}
                <Link
                  href={hrefForLocale(`/auteurs/${article.author.id}`, locale)}
                  className="name transition-colors hover:text-primary"
                >
                  {article.author.name}
                </Link>
              </>
            ) : (
              <>
                {locale === "fr" ? "Par " : "By "}
                <span className="name">
                  {locale === "fr" ? "La rédaction" : "Newsroom"}
                </span>
              </>
            )}
            {" · Port-au-Prince"}
            {article.publishedAt ? (
              <>
                {" · "}
                <time dateTime={article.publishedAt}>
                  {format(new Date(article.publishedAt), "d MMMM yyyy", {
                    locale: locale === "fr" ? fr : enUS,
                  })}
                </time>
              </>
            ) : null}
            {" · "}
            <span className="not-italic font-label text-[11px] font-bold uppercase tracking-[1px]">
              {article.readingTime} {locale === "fr" ? "min de lecture" : "min read"}
            </span>
            {wasUpdated && article.updatedAt ? (
              <>
                {" · "}
                <span className="text-accent-teal">
                  {locale === "fr" ? "Mis à jour le" : "Updated"}{" "}
                  {format(new Date(article.updatedAt), "d MMMM yyyy", {
                    locale: locale === "fr" ? fr : enUS,
                  })}
                </span>
              </>
            ) : null}
          </p>

          {article.alternateLanguageSlug ? (
            <div className="mt-4 border-l-2 border-primary pl-4 font-label text-xs font-bold uppercase text-muted">
              <Link
                href={`/${locale === "fr" ? "en" : "fr"}/articles/${article.alternateLanguageSlug}`}
                className="text-foreground transition-colors hover:text-primary"
              >
                {alternateLabel}
              </Link>
            </div>
          ) : null}

          <AITranslationNotice
            locale={locale as "fr" | "en"}
            alternateLanguageSlug={article.alternateLanguageSlug}
          />
        </header>

        {article.imageSrc ? (
          <figure className="mt-5">
            <div className="relative aspect-[16/9] overflow-hidden bg-surface-elevated">
              <Image
                src={article.imageSrc}
                alt={buildArticleImageAlt({
                  title: article.title,
                  categoryName: article.category?.name,
                  caption: article.coverImageCaption,
                  locale,
                })}
                fill
                sizes="(min-width: 1280px) 1280px, 100vw"
                quality={92}
                className="object-cover"
                priority
              />
            </div>
            {article.coverImageCaption ? (
              <figcaption className="mt-3 border-t border-border-subtle pt-3 font-body text-sm italic leading-snug text-muted">
                {article.coverImageCaption}
              </figcaption>
            ) : null}
          </figure>
        ) : null}

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
          <div className="min-w-0">
            {/* Editorial enrichments — render only when article data carries them. */}
            <ArticleKeyPoints
              points={(article as { keyPoints?: string[] | null }).keyPoints}
              locale={locale as "fr" | "en"}
            />
            <ArticleContextBox
              context={(article as { context?: string | null }).context}
              locale={locale as "fr" | "en"}
            />

            {bodyHasHtml ? (
              <div
                className="prose prose-lg reading-column font-body leading-relaxed dark:prose-invert prose-headings:font-headline prose-a:text-primary animate-fade-in-up"
                dangerouslySetInnerHTML={{ __html: article.body }}
              />
            ) : (
              <div className="prose prose-lg reading-column font-body leading-relaxed dark:prose-invert prose-headings:font-headline prose-a:text-primary animate-fade-in-up">
                {article.body.split("\n").map((paragraph, index) =>
                  paragraph.trim() ? <p key={index}>{paragraph}</p> : null,
                )}
              </div>
            )}

            <hr className="end-of-article" aria-hidden="true" />

            {article.correction && (
              <aside
                role="note"
                aria-label={locale === "fr" ? "Correction" : "Correction"}
                className="my-6 rounded border-l-4 border-amber-500 bg-amber-50 px-5 py-4 font-body text-sm text-amber-900 dark:border-amber-600 dark:bg-amber-950 dark:text-amber-200"
              >
                <p className="mb-1 font-label text-xs font-extrabold uppercase tracking-wider">
                  {locale === "fr" ? "Correction" : "Correction"}
                  {article.correctionDate && (
                    <span className="ml-2 font-normal normal-case">
                      — {new Date(article.correctionDate).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-CA", { dateStyle: "long" })}
                    </span>
                  )}
                </p>
                <p>{article.correction}</p>
              </aside>
            )}

            {article.author?.name ? (
              <aside className="author-bio" aria-label={locale === "fr" ? "À propos de l’auteur" : "About the author"}>
                <div className="min-w-0 flex-1">
                  <p className="author-bio-label">
                    {locale === "fr" ? "L’auteur" : "The author"}
                  </p>
                  <p className="author-bio-name">{article.author.name}</p>
                  <p className="author-bio-text">
                    {locale === "fr"
                      ? `Journaliste au Relief${article.category?.name ? `, couvre la rubrique ${article.category.name}` : ""}.`
                      : `Journalist at Le Relief${article.category?.name ? `, covers ${article.category.name}` : ""}.`}
                  </p>
                  <Link
                    href={hrefForLocale(`/auteurs/${article.author.id}`, locale)}
                    className="author-bio-link"
                  >
                    {locale === "fr"
                      ? `Tous les articles de ${article.author.name}`
                      : `More from ${article.author.name}`}
                  </Link>
                </div>
              </aside>
            ) : null}

            <SourceAttribution
              sources={(article as { sources?: import("@/components/public/SourceAttribution").ArticleSource[] | null }).sources}
              locale={locale as "fr" | "en"}
            />

            <div className="mt-10 border-t border-border-subtle pt-4">
              <Link
                href={hrefForLocale("/corrections", locale)}
                className="font-label text-[11px] font-bold uppercase text-muted transition-colors hover:text-primary"
              >
                {locale === "fr"
                  ? "Signaler une erreur dans cet article"
                  : "Report an issue in this article"}
              </Link>
            </div>

            <RelatedDossier articles={related} locale={locale as "fr" | "en"} />

            <ArticlePrevNext
              prev={adjacent.prev as { slug: string; title: string; category?: { name: string } | null } | null}
              next={adjacent.next as { slug: string; title: string; category?: { name: string } | null } | null}
              locale={locale as "fr" | "en"}
            />
          </div>

          <aside className="space-y-8 border-t-2 border-border-strong pt-4 lg:sticky lg:top-28 lg:h-fit lg:border-l lg:border-t-0 lg:pl-8" data-print-hide>
            {article.toc.length >= 3 ? <TableOfContents toc={article.toc} locale={locale} /> : null}

            <ArticleShareButtons
              url={articleUrl}
              title={article.title}
              locale={locale as "fr" | "en"}
            />

            <section className="border-t border-border-subtle pt-5">
              <p className="section-kicker mb-3">Newsletter</p>
              <h2 className="font-headline text-2xl font-extrabold leading-tight text-foreground">
                {locale === "fr" ? "Recevez la prochaine édition." : "Get the next edition."}
              </h2>
              <div className="mt-5">
                <NewsletterSignup context="article-sidebar" locale={locale} />
              </div>
            </section>
          </aside>
        </div>
      </article>
    </>
  );
}
