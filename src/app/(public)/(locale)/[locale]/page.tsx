import Link from "next/link";
import type { Metadata } from "next";
import HeroSection from "@/components/public/HeroSection";
import ArticleCard from "@/components/public/ArticleCard";
import LatestArticlesFeed from "@/components/public/LatestArticlesFeed";
import CategoryGrid from "@/components/public/CategoryGrid";
import NewsletterSignup from "@/components/public/NewsletterSignup";
import SectionRibbon from "@/components/ui/SectionRibbon";
import { getHomepageContent } from "@/lib/editorial";
import { formatHeadlineTypography } from "@/lib/content-format";
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

  const title = locale === "fr" ? "Le Relief — Média numérique haïtien" : "Le Relief — Haitian digital publication";
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

function SectionHeader({
  kicker,
  title,
  href,
}: {
  kicker: string;
  title: string;
  href?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between border-t-2 border-border-strong pt-3">
      <div>
        <p className="section-kicker mb-2 tracking-[1px]">{kicker}</p>
        <h2 className="font-headline text-3xl font-extrabold leading-none text-foreground sm:text-4xl">
          {title}
        </h2>
      </div>
      {href ? (
        <Link
          href={href}
          className="hidden font-label text-xs font-extrabold uppercase text-foreground transition-colors hover:text-primary sm:block"
        >
          {kicker === "English" ? "See all" : "Tout voir"}
        </Link>
      ) : null}
    </div>
  );
}

export default async function LocalizedHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!validateLocale(locale)) return null;

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
    { name: locale === "fr" ? "Accueil" : "Home", item: `/${locale}` },
  ]);

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
      <HeroSection article={hero || undefined} locale={locale} />

      <div className="newspaper-shell">
        {secondary.length > 0 ? (
          <section className="mb-14 sm:mb-20">
            <div className="mb-4">
              <SectionRibbon label={locale === "fr" ? "À la une" : "Top stories"} variant="dark" />
            </div>
            <SectionHeader
              kicker={locale === "fr" ? "À suivre" : "Coverage"}
              title={locale === "fr" ? "Les autres titres" : "More headlines"}
            />
            <div className="grid gap-0 md:grid-cols-3">
              {secondary.map((article, index) => (
                <div
                  key={article.id}
                  className={index < secondary.length - 1 ? "md:border-r md:border-border-subtle" : ""}
                >
                  {index === 0 ? (
                    <ArticleCard article={article} />
                  ) : (
                    <div className="md:pl-6">
                      <ArticleCard article={article} variant="text" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12">
          <div className="min-w-0">
            {latest.length > 0 ? (
              <section className="mb-14 sm:mb-20">
                <SectionHeader
                  kicker={locale === "fr" ? "Dernières nouvelles" : "Latest"}
                  title={locale === "fr" ? "Le fil de la rédaction" : "Latest from the newsroom"}
                  href="/categories"
                />
                <LatestArticlesFeed initialArticles={latest} locale={locale} />
              </section>
            ) : null}

            {editorial.length > 0 ? (
              <section className="mb-14 sm:mb-20">
                <div className="mb-4">
                  <SectionRibbon
                    label={locale === "fr" ? "Contexte & analyse" : "Context & analysis"}
                  />
                </div>
                <SectionHeader
                  kicker={locale === "fr" ? "Contexte" : "Perspective"}
                  title={
                    locale === "fr"
                      ? "Analyses, opinions et dossiers"
                      : "Analysis, opinion and explainers"
                  }
                />
                <div className="grid gap-7 md:grid-cols-2">
                  {editorial.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="space-y-10 lg:sticky lg:top-40 lg:h-fit">
            {mostRead.length > 0 ? (
              <section className="border-t-2 border-border-strong pt-4">
                <p className="section-kicker mb-2">{locale === "fr" ? "Lecture" : "Read"}</p>
                <h3 className="mb-4 font-headline text-2xl font-extrabold text-foreground">
                  {locale === "fr" ? "Les plus lus" : "Most read"}
                </h3>
                <div className="divide-y divide-border-subtle">
                  {mostRead.map((article, index) => (
                    <Link
                      key={article.id}
                      href={`/articles/${article.slug}`}
                      className="group grid grid-cols-[3rem_1fr] gap-3 py-4"
                    >
                      <span className="editorial-numeral" style={{ fontSize: "1.75rem", color: "var(--border-subtle)" }}>
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
              <section className="border-t-2 border-border-strong pt-4">
                <div className="mb-5">
                  <p className="section-kicker mb-2">{locale === "fr" ? "Rubriques" : "Sections"}</p>
                  <h3 className="font-headline text-2xl font-extrabold text-foreground">
                    {locale === "fr" ? "Parcourir" : "Browse"}
                  </h3>
                </div>
                <CategoryGrid categories={categories} locale={locale} />
              </section>
            ) : null}

            {showNewsletter ? (
              <section className="border-t-2 border-border-strong pt-4">
                <p className="section-kicker mb-2">Newsletter</p>
                <h3 className="font-headline text-2xl font-extrabold leading-tight text-foreground">
                  {locale === "fr" ? "Recevez les sujets qui comptent." : "Get stories that matter."}
                </h3>
                <div className="mt-5">
                  <NewsletterSignup context="home-sidebar" />
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      </div>

      {categories.length > 0 ? (
        <section className="newspaper-shell mt-14 pb-16 sm:mt-20 sm:pb-20">
          <SectionHeader
            kicker={locale === "fr" ? "Taxonomie" : "Taxonomy"}
            title={locale === "fr" ? "Rubriques principales" : "Main sections"}
            href="/categories"
          />
          <CategoryGrid variant="grid" categories={categories} locale={locale} />
        </section>
      ) : null}

      {locale === "fr" && englishSelection.length > 0 ? (
        <section className="newspaper-shell pb-16 sm:pb-20">
          <SectionHeader kicker="English" title="Selected English coverage" href="/en" />
          <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-4">
            {englishSelection.map((article) => (
              <ArticleCard key={article.id} article={article} locale="en" />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
