import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import ArticleCard from "@/components/public/ArticleCard";
import { getAuthorPageContent } from "@/lib/public-content";
import { normalizeAuthor } from "@/lib/editorial";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const content = await getAuthorPageContent(id);
  const author = content ? normalizeAuthor(content.author) : null;
  if (!author) return {};

  return {
    title: `${author.name} | Le Relief Haïti`,
    description:
      author.bio ||
      `Articles récents de ${author.name}, publiés sur Le Relief Haïti.`,
    alternates: {
      canonical: `/auteurs/${id}`,
    },
  };
}

export default async function AuthorPage({ params }: Props) {
  const { id } = await params;
  const content = await getAuthorPageContent(id);
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
          <p className="page-kicker mb-3">Auteur</p>
          <h1 className="editorial-title text-5xl text-foreground sm:text-7xl">
            {author.name}
          </h1>
          <p className="mt-3 font-label text-xs font-bold uppercase text-muted">
            {author.role}
          </p>
          {author.bio ? (
            <p className="editorial-deck mt-4 max-w-2xl font-body text-xl">
              {author.bio}
            </p>
          ) : null}
        </div>
      </header>

      <section>
        <div className="mb-5 border-t border-border-strong pt-3">
          <p className="section-kicker mb-2">Articles récents</p>
          <h2 className="font-headline text-3xl font-extrabold leading-none text-foreground">
            Publications
          </h2>
        </div>

        {content.articles.length > 0 ? (
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
            {content.articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <p className="border-t border-border-subtle py-8 font-body text-lg text-muted">
            Aucun article publié pour cet auteur pour le moment.
          </p>
        )}
      </section>
    </div>
  );
}
