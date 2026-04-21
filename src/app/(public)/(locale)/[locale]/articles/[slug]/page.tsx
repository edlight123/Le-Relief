import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { format, differenceInHours } from "date-fns";
import { enUS, fr } from "date-fns/locale";
import RelatedArticles from "@/components/public/RelatedArticles";
import NewsletterSignup from "@/components/public/NewsletterSignup";
import Breadcrumb from "@/components/public/Breadcrumb";
import ReadingProgress from "@/components/public/ReadingProgress";
import CopyLinkButton from "@/components/public/CopyLinkButton";
import TableOfContents from "@/components/public/TableOfContents";
import { siteConfig } from "@/config/site.config";
import { getPublicArticleBySlug, getRelatedArticles } from "@/lib/editorial";
import * as articlesRepo from "@/lib/repositories/articles";
import { validateLocale } from "@/lib/locale";

export const revalidate = 300;

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  if (!validateLocale(locale)) return {};

  const article = await getPublicArticleBySlug(slug, locale);
  if (!article) return {};

  const title = `${article.title} | Le Relief`;
  const description =
    article.excerpt || article.subtitle || "Read this article on Le Relief.";
  const coverImage = article.imageSrc || null;
  const ogParams = new URLSearchParams({ title: article.title });
  if (article.category) ogParams.set("category", article.category.name);
  if (article.author) ogParams.set("author", article.author.name);
  const generatedOgImage = `${siteConfig.url}/api/og?${ogParams.toString()}`;
  const ogImage = coverImage || generatedOgImage;

  const alternateLocale = locale === "fr" ? "en" : "fr";
  const alternates = {
    canonical: `/${locale}/articles/${slug}`,
    languages: article.alternateLanguageSlug
      ? {
          [locale]: `/${locale}/articles/${slug}`,
          [alternateLocale]: `/${alternateLocale}/articles/${article.alternateLanguageSlug}`,
          "x-default": `/fr/articles/${locale === "fr" ? slug : article.alternateLanguageSlug}`,
        }
      : {
          [locale]: `/${locale}/articles/${slug}`,
          "x-default": locale === "fr" ? `/fr/articles/${slug}` : `/en/articles/${slug}`,
        },
  };

  return {
    title,
    description,
    alternates,
    openGraph: {
      type: "article",
      locale: locale === "fr" ? "fr_FR" : "en_US",
      url: `${siteConfig.url}/${locale}/articles/${slug}`,
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

  const related = await getRelatedArticles(article, 4, locale);
  const bodyHasHtml = /<\/?[a-z][\s\S]*>/i.test(article.body);
  const articleUrl = `${siteConfig.url}/${locale}/articles/${slug}`;
  const alternateLabel = locale === "fr" ? "Lire en anglais" : "Read in French";

  const wasUpdated =
    article.updatedAt &&
    article.publishedAt &&
    differenceInHours(new Date(article.updatedAt), new Date(article.publishedAt)) > 1;

  return (
    <>
      <ReadingProgress />
      <article className="newspaper-shell py-10 sm:py-14" data-print-hide="false">
        <Breadcrumb
          locale={locale}
          crumbs={[
            { label: locale === "fr" ? "Accueil" : "Home", href: `/${locale}` },
            ...(article.category
              ? [
                  {
                    label: article.category.name,
                    href: `/${locale}/categories/${article.category.slug}`,
                  },
                ]
              : [
                  {
                    label: locale === "fr" ? "Articles" : "Articles",
                    href: `/${locale}/categories`,
                  },
                ]),
            { label: article.title },
          ]}
        />

        <header className="border-t-2 border-border-strong pt-5">
          <div className="flex flex-wrap items-center gap-3 font-label text-xs font-extrabold uppercase">
            {article.category ? (
              <Link
                href={`/${locale}/categories/${article.category.slug}`}
                className="text-primary transition-colors hover:text-foreground"
              >
                {article.category.name}
              </Link>
            ) : null}
            {article.contentTypeLabel ? (
              <span className="text-muted">{article.contentTypeLabel}</span>
            ) : null}
          </div>

          <h1 className="editorial-title mt-4 max-w-5xl text-4xl text-foreground sm:text-5xl lg:text-6xl">
            {article.title}
          </h1>

          {(article.subtitle || article.excerpt) ? (
            <p className="editorial-deck mt-5 max-w-3xl font-body text-2xl">
              {article.subtitle || article.excerpt}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-3 border-y border-border-subtle py-3 font-label text-xs font-bold uppercase text-muted">
            {article.author ? (
              <Link
                href={`/${locale}/auteurs/${article.author.id}`}
                className="transition-colors hover:text-primary"
              >
                {locale === "fr" ? "Par" : "By"}{" "}
                <span className="text-foreground">{article.author.name}</span>
              </Link>
            ) : (
              <span>
                {locale === "fr" ? "Par" : "By"}{" "}
                <span className="text-foreground">
                  {locale === "fr" ? "La rédaction" : "Newsroom"}
                </span>
              </span>
            )}
            {article.publishedAt ? (
              <>
                <span className="text-border-subtle">/</span>
                <time dateTime={article.publishedAt}>
                  {format(new Date(article.publishedAt), "d MMMM yyyy", {
                    locale: locale === "fr" ? fr : enUS,
                  })}
                </time>
              </>
            ) : null}
            {wasUpdated && article.updatedAt ? (
              <>
                <span className="text-border-subtle">/</span>
                <span className="text-accent-teal">
                  {locale === "fr" ? "Mis à jour le" : "Updated on"}{" "}
                  {format(new Date(article.updatedAt), "d MMMM yyyy", {
                    locale: locale === "fr" ? fr : enUS,
                  })}
                </span>
              </>
            ) : null}
            <span className="text-border-subtle">/</span>
            <span>
              {article.readingTime} {locale === "fr" ? "min de lecture" : "min read"}
            </span>
          </div>

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
        </header>

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

            <div className="mt-10 border-t border-border-subtle pt-4">
              <Link
                href={`/${locale}/corrections`}
                className="font-label text-[11px] font-bold uppercase text-muted transition-colors hover:text-primary"
              >
                {locale === "fr"
                  ? "Signaler une erreur dans cet article"
                  : "Report an issue in this article"}
              </Link>
            </div>

            <RelatedArticles articles={related} locale={locale} />
          </div>

          <aside className="space-y-8 border-t-2 border-border-strong pt-4 lg:border-l lg:border-t-0 lg:pl-8" data-print-hide>
            {article.toc.length >= 3 ? <TableOfContents toc={article.toc} locale={locale} /> : null}

            <section>
              <p className="section-kicker mb-3">
                {locale === "fr" ? "Partager" : "Share"}
              </p>
              <div className="flex flex-col gap-3 font-label text-xs font-bold uppercase">
                <CopyLinkButton url={articleUrl} />
              </div>
            </section>

            <section className="border-t border-border-subtle pt-5">
              <p className="section-kicker mb-3">Newsletter</p>
              <h2 className="font-headline text-2xl font-extrabold leading-tight text-foreground">
                {locale === "fr" ? "Recevez la prochaine édition." : "Get the next edition."}
              </h2>
              <div className="mt-5">
                <NewsletterSignup />
              </div>
            </section>
          </aside>
        </div>
      </article>
    </>
  );
}
