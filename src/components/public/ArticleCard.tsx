import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import Card from "@/components/ui/Card";

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
        <Card hover className="flex gap-4 p-4">
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
            <h3 className="font-semibold text-sm text-neutral-900 dark:text-white line-clamp-2">
              {article.title}
            </h3>
            {date && (
              <p className="text-xs text-neutral-500 mt-1">{date}</p>
            )}
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/articles/${article.slug}`}>
      <Card hover>
        {article.coverImage && (
          <div className="relative aspect-[16/10] overflow-hidden">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover transition-transform hover:scale-105"
            />
          </div>
        )}
        <div className="p-5">
          {article.category && (
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              {article.category.name}
            </span>
          )}
          <h3 className="mt-2 font-bold text-lg text-neutral-900 dark:text-white line-clamp-2 leading-snug">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">
              {article.excerpt}
            </p>
          )}
          <div className="mt-4 flex items-center gap-2 text-xs text-neutral-400">
            {article.author?.name && <span>{article.author.name}</span>}
            {article.author?.name && date && <span>&middot;</span>}
            {date && <span>{date}</span>}
          </div>
        </div>
      </Card>
    </Link>
  );
}
