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
    title: `${category.name} | Le Relief Haiti`,
    description: (category.description as string) || `Articles in ${category.name}`,
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
    });
    categoryArticles = await Promise.all(
      rawArticles.map(async (article) => {
        const author = article.authorId ? await usersRepo.getUser(article.authorId as string) : null;
        return { ...article, author, category } as Record<string, unknown>;
      })
    );
  } catch {
    // Firestore index may not be ready
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <header className="mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight animate-fade-in-up">
          {String(category.name)}
        </h1>

        <div className="section-divider mt-3" />
        {category.description ? (
          <p className="mt-3 text-lg text-neutral-500 dark:text-neutral-400 max-w-2xl">
            {String(category.description)}
          </p>
        ) : null}
      </header>

      {categoryArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryArticles.map((article) => (
            <ArticleCard
              key={String(article.id)}
              article={{
                title: article.title as string,
                slug: article.slug as string,
                excerpt: article.excerpt as string | null,
                coverImage: article.coverImage as string | null,
                publishedAt: article.publishedAt as string | null,
                author: article.author as { name: string | null } | null,
                category: article.category as { name: string; slug: string } | null,
              }}
            />
          ))}
        </div>
      ) : (
        <p className="text-neutral-500 dark:text-neutral-400">
          No articles in this category yet.
        </p>
      )}
    </div>
  );
}
