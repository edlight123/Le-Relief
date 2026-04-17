import { notFound } from "next/navigation";
import * as categoriesRepo from "@/lib/repositories/categories";
import * as articlesRepo from "@/lib/repositories/articles";
import * as usersRepo from "@/lib/repositories/users";
import ArticleCard from "@/components/public/ArticleCard";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const category = await categoriesRepo.findBySlug(slug);
  if (!category) return {};
  return {
    title: `${category.name} | Le Relief Haïti`,
    description: (category.description as string) || `Articles dans ${category.name}`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;

  const category = await categoriesRepo.findBySlug(slug);
  if (!category) notFound();

  let categoryArticles: Record<string, unknown>[] = [];
  try {
    const { articles: rawArticles } = await articlesRepo.getArticles({
      status: "published",
      categoryId: category.id as string,
      take: 30,
    });

    // Batch-fetch unique authors to avoid N+1 queries
    const authorIds = [...new Set(rawArticles.map((a) => a.authorId as string).filter(Boolean))];
    const authorMap = new Map<string, Record<string, unknown> | null>();
    await Promise.all(
      authorIds.map(async (id) => {
        const author = await usersRepo.getUser(id);
        authorMap.set(id, author);
      })
    );

    categoryArticles = rawArticles.map((article) => {
      const author = article.authorId ? authorMap.get(article.authorId as string) || null : null;
      return { ...article, author, category } as Record<string, unknown>;
    });
  } catch (error) {
    console.error("Error fetching category articles:", error);
  }

  return (
    <div className="newspaper-shell py-10 sm:py-14">
      <header className="mb-10 border-t-2 border-border-strong pt-5">
        <p className="page-kicker mb-3">Rubrique</p>
        <h1 className="editorial-title text-5xl text-foreground sm:text-7xl">
          {String(category.name)}
        </h1>

        {category.description ? (
          <p className="editorial-deck mt-4 max-w-2xl font-body text-xl">
            {String(category.description)}
          </p>
        ) : null}
      </header>

      {categoryArticles.length > 0 ? (
        <div className="grid grid-cols-1 gap-7 border-t border-border-strong pt-6 md:grid-cols-2 lg:grid-cols-3">
          {categoryArticles.map((article) => (
            <ArticleCard
              key={String(article.id)}
              article={{
                title: article.title as string,
                slug: article.slug as string,
                excerpt: article.excerpt as string | null,
                coverImage: article.coverImage as string | null,
                coverImageFirebaseUrl: article.coverImageFirebaseUrl as string | null,
                publishedAt: article.publishedAt as string | null,
                author: article.author as { name: string | null } | null,
                category: article.category as { name: string; slug: string } | null,
              }}
            />
          ))}
        </div>
      ) : (
        <p className="border-t border-border-subtle py-8 font-body text-lg text-muted">
          Aucun article dans cette catégorie pour le moment.
        </p>
      )}
    </div>
  );
}
