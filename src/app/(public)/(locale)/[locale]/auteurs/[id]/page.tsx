import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import LatestArticlesFeed from "@/components/public/LatestArticlesFeed";
import { getAuthorPageContent, normalizeAuthor } from "@/lib/editorial";
import { validateLocale } from "@/lib/locale";
import {
  buildBreadcrumbJsonLd,
  buildCanonicalAlternates,
  buildMetaDescription,
  buildRobotsDirective,
  serializeJsonLd,
} from "@/lib/seo";

export const revalidate = 300;

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params;
  if (!validateLocale(locale)) return {};

  const content = await getAuthorPageContent(id, locale);
  const author = content ? normalizeAuthor(content.author) : null;
  if (!author) return {};

  return {
    title: `${author.name} | Le Relief`,
    description: buildMetaDescription({
      title: `${author.name} | Le Relief`,
      excerpt:
        author.bio ||
        (locale === "fr"
          ? `Articles récents, analyses et commentaires signés par ${author.name}.`
          : `Latest reporting, analysis and commentary by ${author.name}.`),
      locale,
      keyword: author.name,
      cta:
        locale === "fr"
          ? "Découvrez les publications de cet auteur sur Le Relief."
          : "Explore this author's latest work on Le Relief.",
    }),
    alternates: buildCanonicalAlternates(`/${locale}/auteurs/${id}`, {
      fr: `/fr/auteurs/${id}`,
      en: `/en/auteurs/${id}`,
      "x-default": `/fr/auteurs/${id}`,
    }),
    robots: buildRobotsDirective(content?.articles.length ? "published" : "draft"),
  };
}

export default async function LocalizedAuthorPage({ params }: Props) {
  const { id, locale } = await params;
  if (!validateLocale(locale)) notFound();

  const content = await getAuthorPageContent(id, locale);
  const author = content ? normalizeAuthor(content.author) : null;
  if (!content || !author) notFound();

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: locale === "fr" ? "Accueil" : "Home", item: `/${locale}` },
    { name: author.name, item: `/${locale}/auteurs/${id}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <div className="newspaper-shell py-6 sm:py-10">
      <header className="mb-8 border-y-2 border-border-strong py-8 text-center sm:py-12">
        <div className="mx-auto mb-5 flex h-[110px] w-[110px] items-center justify-center overflow-hidden rounded-full border border-border-subtle bg-surface-newsprint font-headline text-4xl font-extrabold text-foreground">
          {author.image ? (
            <Image
              src={author.image}
              alt={author.name}
              width={110}
              height={110}
              sizes="110px"
              className="h-full w-full object-cover"
              priority
            />
          ) : (
            author.name.slice(0, 1)
          )}
        </div>
        <p className="page-kicker mb-3" style={{ letterSpacing: "1.4px" }}>
          {locale === "fr" ? "L’auteur" : "The author"}
        </p>
        <h1 className="editorial-title mx-auto max-w-3xl text-4xl text-foreground sm:text-6xl">
          {author.name}
        </h1>
        {author.role ? (
          <p className="mt-3 font-body text-base italic text-muted sm:text-lg">
            {author.role}
          </p>
        ) : null}
        {author.bio ? (
          <p className="editorial-deck mx-auto mt-4 max-w-2xl font-body text-base sm:text-lg">
            {author.bio}
          </p>
        ) : null}
      </header>

      <section>
        <div className="mb-4 flex items-baseline justify-between border-t border-border-strong pt-2">
          <p className="section-kicker">
            {locale === "fr" ? "Publications" : "Publications"}
          </p>
          {content.articles.length > 0 ? (
            <p className="font-label text-[11px] font-bold uppercase tracking-[1px] text-muted">
              {content.articles.length}
              {" "}
              {locale === "fr"
                ? content.articles.length > 1 ? "articles" : "article"
                : content.articles.length > 1 ? "stories" : "story"}
            </p>
          ) : null}
        </div>

        {content.articles.length > 0 ? (
          <LatestArticlesFeed
            initialArticles={content.articles}
            authorId={id}
            variant="grid"
            locale={locale}
          />
        ) : (
          <p className="py-8 text-center font-body text-base italic text-muted">
            {locale === "fr"
              ? "Aucun article publié pour cet auteur pour le moment."
              : "No published article for this author yet."}
          </p>
        )}
      </section>
      </div>
    </>
  );
}
