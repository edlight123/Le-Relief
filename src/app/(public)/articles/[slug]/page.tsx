import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { db } from "@/lib/db";
import RelatedArticles from "@/components/public/RelatedArticles";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const article = await db.article.findUnique({
    where: { slug },
    select: { title: true, excerpt: true },
  });
  if (!article) return {};
  return {
    title: `${article.title} | Le Relief Haiti`,
    description: article.excerpt || "",
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;

  const article = await db.article.findUnique({
    where: { slug, status: "published" },
    include: { author: true, category: true },
  });

  if (!article) notFound();

  // Track view
  await db.article.update({
    where: { id: article.id },
    data: { views: { increment: 1 } },
  });

  // Related articles
  const related = await db.article.findMany({
    where: {
      status: "published",
      id: { not: article.id },
      categoryId: article.categoryId || undefined,
    },
    include: { author: true, category: true },
    take: 3,
    orderBy: { publishedAt: "desc" },
  });

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Category */}
      {article.category && (
        <Link
          href={`/categories/${article.category.slug}`}
          className="text-xs font-semibold uppercase tracking-widest text-primary hover:text-primary-light"
        >
          {article.category.name}
        </Link>
      )}

      {/* Title */}
      <h1 className="mt-4 text-3xl md:text-5xl font-bold text-foreground tracking-tight leading-tight animate-fade-in-up">
        {article.title}
      </h1>

      {/* Subtitle */}
      {article.subtitle && (
        <p className="mt-3 text-xl text-neutral-500 dark:text-neutral-400">
          {article.subtitle}
        </p>
      )}

      {/* Meta */}
      <div className="mt-6 flex items-center gap-3 text-sm text-neutral-500">
        {article.author?.name && <span>By <span className="font-medium text-accent-blue">{article.author.name}</span></span>}
        {article.publishedAt && (
          <>
            <span>&middot;</span>
            <time>{format(new Date(article.publishedAt), "MMMM d, yyyy")}</time>
          </>
        )}
      </div>

      {/* Cover */}
      {article.coverImage && (
        <div className="mt-8 relative aspect-[16/9] rounded-xl overflow-hidden">
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Body */}
      <div className="mt-10 prose prose-lg dark:prose-invert max-w-none leading-relaxed">
        {article.body.split("\n").map((p, i) =>
          p.trim() ? <p key={i}>{p}</p> : null
        )}
      </div>

      {/* Related */}
      <RelatedArticles articles={related} />
    </article>
  );
}
