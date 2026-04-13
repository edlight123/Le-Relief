import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import * as articlesRepo from "@/lib/repositories/articles";
import * as usersRepo from "@/lib/repositories/users";
import * as categoriesRepo from "@/lib/repositories/categories";
import RelatedArticles from "@/components/public/RelatedArticles";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const article = await articlesRepo.findBySlug(slug);
  if (!article) return {};
  return {
    title: `${article.title} | Le Relief Haiti`,
    description: (article.excerpt as string) || "",
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;

  const rawArticle = await articlesRepo.findBySlug(slug);
  if (!rawArticle || rawArticle.status !== "published") notFound();

  const author = rawArticle.authorId ? await usersRepo.getUser(rawArticle.authorId as string) : null;
  const category = rawArticle.categoryId ? await categoriesRepo.getCategory(rawArticle.categoryId as string) : null;
  const article = { ...rawArticle, author, category } as Record<string, unknown>;

  // Track view
  await articlesRepo.incrementViews(article.id as string);

  // Related articles
  const { articles: rawRelated } = await articlesRepo.getArticles({
    status: "published",
    categoryId: (article.categoryId as string) || undefined,
    excludeId: article.id as string,
    take: 3,
  });
  const related = await Promise.all(
    rawRelated.map(async (a) => {
      const rAuthor = a.authorId ? await usersRepo.getUser(a.authorId as string) : null;
      const rCategory = a.categoryId ? await categoriesRepo.getCategory(a.categoryId as string) : null;
      return {
        title: a.title as string,
        slug: a.slug as string,
        excerpt: a.excerpt as string | null,
        coverImage: a.coverImage as string | null,
        publishedAt: a.publishedAt as string | null,
        author: rAuthor ? { name: rAuthor.name as string | null } : null,
        category: rCategory ? { name: rCategory.name as string, slug: rCategory.slug as string } : null,
      };
    })
  );

  const cat = article.category as Record<string, unknown> | null;
  const auth = article.author as Record<string, unknown> | null;

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Category */}
      {cat ? (
        <Link
          href={`/categories/${cat.slug}`}
          className="text-xs font-semibold uppercase tracking-widest text-primary hover:text-primary-light"
        >
          {String(cat.name)}
        </Link>
      ) : null}

      {/* Title */}
      <h1 className="mt-4 text-3xl md:text-5xl font-bold text-foreground tracking-tight leading-tight animate-fade-in-up">
        {String(article.title)}
      </h1>

      {/* Subtitle */}
      {article.subtitle ? (
        <p className="mt-3 text-xl text-neutral-500 dark:text-neutral-400">
          {String(article.subtitle)}
        </p>
      ) : null}

      {/* Meta */}
      <div className="mt-6 flex items-center gap-3 text-sm text-neutral-500">
        {auth?.name ? <span>By <span className="font-medium text-accent-blue">{String(auth.name)}</span></span> : null}
        {article.publishedAt ? (
          <>
            <span>&middot;</span>
            <time>{format(new Date(article.publishedAt as string), "MMMM d, yyyy")}</time>
          </>
        ) : null}
      </div>

      {/* Cover */}
      {article.coverImage ? (
        <div className="mt-8 relative aspect-[16/9] rounded-xl overflow-hidden">
          <Image
            src={article.coverImage as string}
            alt={String(article.title)}
            fill
            className="object-cover"
            priority
          />
        </div>
      ) : null}

      {/* Body */}
      <div className="mt-10 prose prose-lg dark:prose-invert max-w-none leading-relaxed">
        {String(article.body).split("\n").map((p: string, i: number) =>
          p.trim() ? <p key={i}>{p}</p> : null
        )}
      </div>

      {/* Related */}
      <RelatedArticles articles={related} />
    </article>
  );
}
