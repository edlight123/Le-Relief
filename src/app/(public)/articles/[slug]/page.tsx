import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
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
    title: `${article.title} | Le Relief Haïti`,
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
  let related: {
    title: string;
    slug: string;
    excerpt: string | null;
    coverImage: string | null;
    coverImageFirebaseUrl?: string | null;
    publishedAt: string | null;
    author: { name: string | null } | null;
    category: { name: string; slug: string } | null;
  }[] = [];
  try {
    const { articles: rawRelated } = await articlesRepo.getArticles({
      status: "published",
      categoryId: (article.categoryId as string) || undefined,
      excludeId: article.id as string,
      take: 3,
    });
    related = await Promise.all(
      rawRelated.map(async (a) => {
        const rAuthor = a.authorId ? await usersRepo.getUser(a.authorId as string) : null;
        const rCategory = a.categoryId ? await categoriesRepo.getCategory(a.categoryId as string) : null;
        return {
          title: a.title as string,
          slug: a.slug as string,
          excerpt: a.excerpt as string | null,
          coverImage: a.coverImage as string | null,
          coverImageFirebaseUrl: a.coverImageFirebaseUrl as string | null,
          publishedAt: a.publishedAt as string | null,
          author: rAuthor ? { name: rAuthor.name as string | null } : null,
          category: rCategory ? { name: rCategory.name as string, slug: rCategory.slug as string } : null,
        };
      })
    );
  } catch {
    // Firestore index may not be ready
  }

  const cat = article.category as Record<string, unknown> | null;
  const auth = article.author as Record<string, unknown> | null;
  const coverImage =
    (article.coverImageFirebaseUrl as string | null) ||
    (article.coverImage as string | null);
  const body = String(article.body || "");
  const bodyHasHtml = /<\/?[a-z][\s\S]*>/i.test(body);

  return (
    <article className="newspaper-shell py-10 sm:py-14">
      <header className="border-t-2 border-border-strong pt-5">
        {cat ? (
          <Link
            href={`/categories/${cat.slug}`}
            className="page-kicker transition-colors hover:text-foreground"
          >
            {String(cat.name)}
          </Link>
        ) : null}

        <h1 className="editorial-title mt-4 max-w-5xl text-5xl text-foreground sm:text-6xl lg:text-8xl">
          {String(article.title)}
        </h1>

        {article.subtitle ? (
          <p className="editorial-deck mt-5 max-w-3xl font-body text-2xl">
            {String(article.subtitle)}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3 border-y border-border-subtle py-3 font-label text-xs font-bold uppercase text-muted">
          {auth?.name ? (
            <span>
              Par <span className="text-foreground">{String(auth.name)}</span>
            </span>
          ) : null}
          {auth?.name && article.publishedAt ? (
            <span className="text-border-subtle">/</span>
          ) : null}
          {article.publishedAt ? (
            <time>
              {format(new Date(article.publishedAt as string), "d MMMM yyyy", { locale: fr })}
            </time>
          ) : null}
        </div>
      </header>

      {coverImage ? (
        <figure className="mt-8">
          <div className="relative aspect-[16/9] overflow-hidden bg-surface-elevated">
            <Image
              src={coverImage}
              alt={String(article.title)}
              fill
              sizes="(min-width: 1280px) 1280px, 100vw"
              className="object-cover"
              priority
            />
          </div>
          <figcaption className="mt-2 border-b border-border-subtle pb-3 font-label text-[11px] uppercase text-muted">
            Le Relief Haïti
          </figcaption>
        </figure>
      ) : null}

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,760px)_1fr] lg:gap-14">
        <div className="min-w-0">
          {bodyHasHtml ? (
            <div
              className="prose prose-lg max-w-none font-body leading-relaxed dark:prose-invert prose-headings:font-headline prose-a:text-primary"
              dangerouslySetInnerHTML={{ __html: body }}
            />
          ) : (
            <div className="prose prose-lg max-w-none font-body leading-relaxed dark:prose-invert prose-headings:font-headline prose-a:text-primary">
              {body.split("\n").map((p: string, i: number) =>
                p.trim() ? <p key={i}>{p}</p> : null
              )}
            </div>
          )}
        </div>

        <aside className="border-t-2 border-border-strong pt-4 lg:border-l lg:border-t-0 lg:pl-8">
          <p className="section-kicker mb-3">Plus à lire</p>
          <RelatedArticles articles={related} compact />
        </aside>
      </div>
    </article>
  );
}
