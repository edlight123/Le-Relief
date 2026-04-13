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
        <div className="flex gap-4 p-4 bg-surface border border-border-subtle rounded-xl premium-card group">
          {article.coverImage && (
            <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
              <Image
                src={article.coverImage}
                alt={article.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-300">
              {article.title}
            </h3>
            {date && (
              <p className="text-xs text-foreground/40 mt-1.5">{date}</p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/articles/${article.slug}`}>
      <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden premium-card group">
        {article.coverImage && (
          <div className="relative aspect-[16/10] overflow-hidden">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Colorful overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-accent-rose/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        )}
        <div className="p-6">
          {article.category && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-teal">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-teal" />
              {article.category.name}
            </span>
          )}
          <h3 className="mt-2.5 font-bold text-lg text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-300">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="mt-2.5 text-sm text-foreground/50 line-clamp-2 leading-relaxed">
              {article.excerpt}
            </p>
          )}
          <div className="mt-5 flex items-center gap-2 text-xs text-foreground/35">
            {article.author?.name && (
              <span className="text-accent-rose/80">{article.author.name}</span>
            )}
            {article.author?.name && date && (
              <span className="text-primary/30">&middot;</span>
            )}
            {date && <span>{date}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
