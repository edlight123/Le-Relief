import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { format, differenceInHours } from "date-fns";
import { fr } from "date-fns/locale";
import RelatedArticles from "@/components/public/RelatedArticles";
import NewsletterSignup from "@/components/public/NewsletterSignup";
import Breadcrumb from "@/components/public/Breadcrumb";
import ReadingProgress from "@/components/public/ReadingProgress";
import ArticleShareButtons from "@/components/public/ArticleShareButtons";
import TableOfContents from "@/components/public/TableOfContents";
import { siteConfig } from "@/config/site.config";
import {
  getPublicArticleBySlug,
  getRelatedArticles,
} from "@/lib/public-content";
import { sanitizeExcerptText } from "@/lib/content-format";
import * as articlesRepo from "@/lib/repositories/articles";

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
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublicArticleBySlug(slug);
  if (!article) return {};

  const title = `${article.title} | Le Relief`;
  const cleanedExcerpt = sanitizeExcerptText(article.excerpt, {
    authorName: article.author?.name ?? null,
  });
  const description =
    cleanedExcerpt || article.subtitle || "Retrouvez cet article sur Le Relief.";
  const coverImage = article.imageSrc || null;
  const ogParams = new URLSearchParams({ title: article.title });
  if (article.category) ogParams.set("category", article.category.name);
  if (article.author) ogParams.set("author", article.author.name);
  const generatedOgImage = `${siteConfig.url}/api/og?${ogParams.toString()}`;
  const ogImage = coverImage || generatedOgImage;

  return {
    title,
    description,
    alternates: {
      canonical: `/articles/${slug}`,
      languages: article.alternateLanguageSlug
        ? {
            [article.language === "fr" ? "en" : "fr"]:
              `/articles/${article.alternateLanguageSlug}`,
          }
        : undefined,
    },
    openGraph: {
      type: "article",
      locale: article.language === "fr" ? "fr_FR" : "en_US",
      url: `${siteConfig.url}/articles/${slug}`,
      siteName: siteConfig.name,
      title,
      description,
      images: [{ url: ogImage, alt: article.title, width: 1200, height: 630 }],
      publishedTime: article.publishedAt || undefined,
      modifiedTime: article.updatedAt || undefined,
      section: article.category?.name,
      authors: article.author?.name ? [article.author.name] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getPublicArticleBySlug(slug);
  if (!article) notFound();

  try {
    await articlesRepo.incrementViews(article.id);
  } catch {
    // Reading must not fail if analytics storage is temporarily unavailable.
  }
  const related = await getRelatedArticles(article, 4);
  const bodyHasHtml = /<\/?[a-z][\s\S]*>/i.test(article.body);
  const firstBodyParagraph = (bodyHasHtml ? stripHtml(article.body) : article.body)
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .find(Boolean) || "";
  const deckText = sanitizeDeckText(article.subtitle || article.excerpt || "");
  const shouldShowDeck = Boolean(deckText) && !isDuplicateIntro(deckText, firstBodyParagraph);
  const displayTitle = formatHeadlineTypography(article.title);
  const articleUrl = `${siteConfig.url}/articles/${slug}`;
  const alternateLabel = article.language === "fr" ? "Lire en anglais" : "Lire en français";

  const wasUpdated =
    article.updatedAt &&
    article.publishedAt &&
    differenceInHours(new Date(article.updatedAt), new Date(article.publishedAt)) > 1;

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description:
      sanitizeExcerptText(article.excerpt, {
        authorName: article.author?.name ?? null,
      }) ||
      article.subtitle ||
      "",
    image: article.imageSrc ? [article.imageSrc] : undefined,
    datePublished: article.publishedAt || undefined,
    dateModified: article.updatedAt || undefined,
    articleSection: article.category?.name,
    inLanguage: article.language === "fr" ? "fr-FR" : "en-US",
    mainEntityOfPage: articleUrl,
    author: article.author
      ? {
          "@type": "Person",
          name: article.author.name,
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}/logo.png`,
      },
    },
  };

  return (
    <>
    <ReadingProgress />
    <article className="newspaper-shell py-10 sm:py-14" data-print-hide="false">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <Breadcrumb
        crumbs={[
          { label: "Accueil", href: "/" },
          ...(article.category
            ? [{ label: article.category.name, href: `/categories/${article.category.slug}` }]
            : [{ label: "Articles", href: "/categories" }]),
          { label: article.title },
        ]}
      />
      <header className="border-t-2 border-border-strong pt-5">
        <div className="flex flex-wrap items-center gap-3 font-label text-xs font-extrabold uppercase">
          {article.category ? (
            <Link
              href={`/categories/${article.category.slug}`}
              className="text-primary transition-colors hover:text-foreground"
            >
              {article.category.name}
            </Link>
          ) : null}
          {article.contentTypeLabel ? (
            <span className="text-muted">{article.contentTypeLabel}</span>
          ) : null}
          {article.language === "en" ? (
            <span className="text-muted">English</span>
          ) : null}
        </div>

        <h1 className="editorial-title mt-4 max-w-5xl text-4xl text-foreground sm:text-5xl lg:text-6xl">
          {displayTitle}
        </h1>

        {shouldShowDeck ? (
          <p className="editorial-deck mt-5 max-w-3xl font-body text-2xl">
            {deckText}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3 border-y border-border-subtle py-3 font-label text-xs font-bold uppercase text-muted">
          {article.author ? (
            <Link
              href={`/auteurs/${article.author.id}`}
              className="transition-colors hover:text-primary"
            >
              Par <span className="text-foreground">{article.author.name}</span>
            </Link>
          ) : (
            <span>Par <span className="text-foreground">La rédaction</span></span>
          )}
          {article.publishedAt ? (
            <>
              <span className="text-border-subtle">/</span>
              <time dateTime={article.publishedAt}>
                {format(new Date(article.publishedAt), "d MMMM yyyy", { locale: fr })}
              </time>
            </>
          ) : null}
          <span className="text-border-subtle">/</span>
          <span>{article.readingTime} min de lecture</span>
        </div>

        {article.alternateLanguageSlug ? (
          <div className="mt-5 flex items-center gap-4 border border-border-subtle px-5 py-3">
            <span className="font-label text-[10px] font-extrabold uppercase text-muted tracking-[1px]">
              {article.language === "fr" ? "Also available in" : "Aussi disponible en"}
            </span>
            <Link
              href={`/articles/${article.alternateLanguageSlug}`}
              className="font-label text-xs font-extrabold uppercase text-primary transition-colors hover:text-foreground"
            >
              {alternateLabel} →
            </Link>
          </div>
        ) : null}

        {article.language === "en" ? (
          <p className="mt-4 max-w-3xl border-l-2 border-border-subtle pl-4 font-body text-base leading-relaxed text-muted">
            Cet article est une adaptation en anglais d&apos;un reportage initialement publié par Le Relief en français.
          </p>
        ) : null}
      </header>

      {article.tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2 border-b border-border-subtle pb-4">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="border border-border-subtle px-2 py-1 font-label text-[11px] font-bold uppercase text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {wasUpdated && article.updatedAt ? (
        <div className="mt-5 flex items-start gap-3 border border-border-subtle bg-surface-newsprint px-5 py-4">
          <span className="mt-0.5 font-label text-[11px] font-extrabold uppercase text-muted tracking-[1px]">Mise à jour</span>
          <p className="font-body text-sm leading-relaxed text-muted">
            Cet article a été mis à jour le{" "}
            <time dateTime={article.updatedAt} className="font-semibold text-foreground">
              {format(new Date(article.updatedAt), "d MMMM yyyy", { locale: fr })}
            </time>
            .{" "}
            <Link href="/corrections" className="font-label text-[11px] font-bold uppercase text-primary transition-colors hover:underline">
              Politique de correction →
            </Link>
          </p>
        </div>
      ) : null}

      {article.imageSrc ? (
        <figure className="mt-8">
          <div className="relative aspect-[16/9] overflow-hidden bg-surface-elevated">
            <Image
              src={article.imageSrc}
              alt={article.title}
              fill
              sizes="(min-width: 1280px) 1280px, 100vw"
              className="object-cover"
              priority
            />
          </div>
          {article.coverImageCaption ? (
            <figcaption className="mt-2 border-b border-border-subtle pb-3 font-label text-[11px] uppercase text-muted">
              {article.coverImageCaption}
            </figcaption>
          ) : null}
        </figure>
      ) : null}

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,760px)_1fr] lg:gap-14">
        <div className="min-w-0">
          {bodyHasHtml ? (
            <div
              className="prose prose-lg max-w-none font-body leading-relaxed dark:prose-invert prose-headings:font-headline prose-a:text-primary"
              dangerouslySetInnerHTML={{ __html: article.body }}
            />
          ) : (
            <div className="prose prose-lg max-w-none font-body leading-relaxed dark:prose-invert prose-headings:font-headline prose-a:text-primary">
              {article.body.split("\n").map((paragraph, index) =>
                paragraph.trim() ? <p key={index}>{paragraph}</p> : null,
              )}
            </div>
          )}

          {/* Corrections link */}
          <div className="mt-10 border-t border-border-subtle pt-4">
            <Link
              href="/corrections"
              className="font-label text-[11px] font-bold uppercase text-muted transition-colors hover:text-primary"
            >
              Signaler une erreur dans cet article
            </Link>
          </div>

          {article.author ? (
            <section className="mt-12 border-t-2 border-border-strong pt-5">
              <p className="section-kicker mb-2">Auteur</p>
              <div className="grid gap-4 sm:grid-cols-[72px_1fr]">
                <div className="flex h-[72px] w-[72px] items-center justify-center border border-border-subtle bg-surface-newsprint font-headline text-2xl font-extrabold text-foreground">
                  {article.author.image ? (
                    <Image
                      src={article.author.image}
                      alt={article.author.name}
                      width={72}
                      height={72}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    article.author.name.slice(0, 1)
                  )}
                </div>
                <div>
                  <Link
                    href={`/auteurs/${article.author.id}`}
                    className="font-headline text-2xl font-extrabold text-foreground transition-colors hover:text-primary"
                  >
                    {article.author.name}
                  </Link>
                  <p className="mt-1 font-label text-xs font-bold uppercase text-muted">
                    {article.author.role}
                  </p>
                  {article.author.bio ? (
                    <p className="mt-3 font-body text-base leading-relaxed text-muted">
                      {article.author.bio}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}

          <RelatedArticles articles={related} />
        </div>

        <aside className="space-y-8 border-t-2 border-border-strong pt-4 lg:border-l lg:border-t-0 lg:pl-8" data-print-hide>
          {article.toc.length >= 3 ? (
            <TableOfContents toc={article.toc} />
          ) : null}

          <ArticleShareButtons url={articleUrl} title={article.title} />

          <section className="border-t border-border-subtle pt-5">
            <p className="section-kicker mb-3">Lettre</p>
            <h2 className="font-headline text-2xl font-extrabold leading-tight text-foreground">
              Recevez la prochaine édition.
            </h2>
            <p className="mt-3 font-body text-base leading-relaxed text-muted">
              Les nouvelles importantes, les analyses et les dossiers à suivre.
            </p>
            <div className="mt-5">
              <NewsletterSignup context="article-sidebar" />
            </div>
          </section>

          {related.length > 0 ? (
            <section className="border-t border-border-subtle pt-5">
              <p className="section-kicker mb-3">Plus à lire</p>
              <RelatedArticles articles={related.slice(0, 3)} compact />
            </section>
          ) : null}
        </aside>
      </div>
    </article>
    </>
  );
}
