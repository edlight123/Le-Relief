import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import LatestArticlesFeed from "@/components/public/LatestArticlesFeed";
import { getAuthorPageContent, normalizeAuthor } from "@/lib/editorial";
import { validateLocale } from "@/lib/locale";

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
    description:
      author.bio ||
      (locale === "fr"
        ? `Articles récents de ${author.name}.`
        : `Latest pieces by ${author.name}.`),
    alternates: {
      canonical: `/${locale}/auteurs/${id}`,
      languages: {
        fr: `/fr/auteurs/${id}`,
        en: `/en/auteurs/${id}`,
        "x-default": `/fr/auteurs/${id}`,
      },
    },
  };
}

export default async function LocalizedAuthorPage({ params }: Props) {
  const { id, locale } = await params;
  if (!validateLocale(locale)) notFound();

  const content = await getAuthorPageContent(id, locale);
  const author = content ? normalizeAuthor(content.author) : null;
  if (!content || !author) notFound();

  return (
    <div className="newspaper-shell py-10 sm:py-14">
      <header className="mb-10 grid gap-6 border-t-2 border-border-strong pt-5 sm:grid-cols-[120px_1fr]">
        <div className="flex h-[120px] w-[120px] items-center justify-center border border-border-subtle bg-surface-newsprint font-headline text-5xl font-extrabold text-foreground">
          {author.image ? (
            <Image
              src={author.image}
              alt={author.name}
              width={120}
              height={120}
              className="h-full w-full object-cover"
              priority
            />
          ) : (
            author.name.slice(0, 1)
          )}
        </div>
        <div>
          <p className="page-kicker mb-3">{locale === "fr" ? "Auteur" : "Author"}</p>
          <h1 className="editorial-title text-5xl text-foreground sm:text-7xl">
            {author.name}
          </h1>
          <p className="mt-3 font-label text-xs font-bold uppercase text-muted">
            {author.role}
          </p>
        </div>
      </header>

      <section>
        <div className="mb-5 border-t border-border-strong pt-3">
          <p className="section-kicker mb-2">
            {locale === "fr" ? "Articles récents" : "Latest"}
          </p>
          <h2 className="font-headline text-3xl font-extrabold leading-none text-foreground">
            {locale === "fr" ? "Publications" : "Publications"}
          </h2>
        </div>

        {content.articles.length > 0 ? (
          <LatestArticlesFeed
            initialArticles={content.articles}
            authorId={id}
            variant="grid"
            locale={locale}
          />
        ) : (
          <p className="border-t border-border-subtle py-8 font-body text-lg text-muted">
            {locale === "fr"
              ? "Aucun article publié pour cet auteur pour le moment."
              : "No published article for this author yet."}
          </p>
        )}
      </section>
    </div>
  );
}
