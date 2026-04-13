import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ArticleCard from "@/components/public/ArticleCard";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const category = await db.category.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });
  if (!category) return {};
  return {
    title: `${category.name} | Le Relief Haiti`,
    description: category.description || `Articles in ${category.name}`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;

  const category = await db.category.findUnique({
    where: { slug },
    include: {
      articles: {
        where: { status: "published" },
        include: { author: true, category: true },
        orderBy: { publishedAt: "desc" },
      },
    },
  });

  if (!category) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <header className="mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight animate-fade-in-up">
          {category.name}
        </h1>

        <div className="section-divider mt-3" />
        {category.description && (
          <p className="mt-3 text-lg text-neutral-500 dark:text-neutral-400 max-w-2xl">
            {category.description}
          </p>
        )}
      </header>

      {category.articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {category.articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
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
