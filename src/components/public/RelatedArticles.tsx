import ArticleCard from "@/components/public/ArticleCard";

interface RelatedArticlesProps {
  articles: {
    title: string;
    slug: string;
    excerpt: string | null;
    coverImage: string | null;
    publishedAt: Date | string | null;
    author?: { name: string | null } | null;
    category?: { name: string; slug: string } | null;
  }[];
}

export default function RelatedArticles({ articles }: RelatedArticlesProps) {
  if (articles.length === 0) return null;

  return (
    <section className="mt-16 pt-12 border-t border-border-subtle">
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          Related <span className="gradient-text">Articles</span>
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-primary/30 via-accent-rose/20 to-transparent" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </section>
  );
}
