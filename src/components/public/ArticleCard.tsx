import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";

interface ArticleCardProps {
  article: {
    title: string;
    slug: string;
    excerpt: string | null;
    coverImage: string | null;
    publishedAt: Date | string | null;
    author?: { name: string | null } | null;
    category?: { name: string; slug: string } | null;
  };
  variant?: "default" | "compact";
}

export default function ArticleCard({
  article,
  variant = "default",
}: ArticleCardProps) {
  const date = article.publishedAt
    ? format(new Date(article.publishedAt), "MMM d, yyyy")
    : null;

  if (variant === "compact") {
    return (
      <Link href={`/articles/${article.slug}`}>
        <div className="flex gap-4 p-4 bg-surface border border-border-subtle rounded-xl article-card group">
          {article.coverImage && (
            <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
              <Image
                src={article.coverImage}
                alt={article.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-200">
              {article.title}
            </h3>
            {date && (
              <p className="text-xs text-muted mt-1.5">{date}</p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/articles/${article.slug}`}>
      <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden article-card group">
        {article.coverImage && (
          <div className="relative aspect-[16/10] overflow-hidden">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}
        <div className="p-5">
          {article.category && (
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary">
              {article.category.name}
            </span>
          )}
          <h3 className="mt-2 font-bold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-200">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="mt-2 text-sm text-muted line-clamp-2 leading-relaxed">
              {article.excerpt}
            </p>
          )}
          <div className="mt-4 flex items-center gap-2 text-xs text-muted">
            {article.author?.name && (
              <span className="font-medium text-accent-blue">{article.author.name}</span>
            )}
            {article.author?.name && date && (
              <span>&middot;</span>
            )}
            {date && <span>{date}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
