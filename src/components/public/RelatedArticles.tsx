import ArticleCard from "@/components/public/ArticleCard";

interface RelatedArticlesProps {
  articles: {
    title: string;
    slug: string;
    excerpt: string | null;
    coverImage: string | null;
    coverImageFirebaseUrl?: string | null;
    publishedAt: Date | string | null;
    author?: { name: string | null } | null;
    category?: { name: string; slug: string } | null;
  }[];
  compact?: boolean;
}

export default function RelatedArticles({ articles, compact = false }: RelatedArticlesProps) {
  if (articles.length === 0) return null;

  if (compact) {
    return (
      <section>
        <div className="divide-y divide-border-subtle">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} variant="compact" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mt-16 border-t-2 border-border-strong pt-8">
      <div className="mb-8">
        <p className="section-kicker mb-2">Lecture suivante</p>
        <h2 className="font-headline text-3xl font-extrabold text-foreground">Articles connexes</h2>
      </div>
      <div className="grid grid-cols-1 gap-7 md:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </section>
  );
}
