import * as articlesRepo from "@/lib/repositories/articles";
import * as usersRepo from "@/lib/repositories/users";
import * as categoriesRepo from "@/lib/repositories/categories";
import HeroSection from "@/components/public/HeroSection";
import ArticleCard from "@/components/public/ArticleCard";
import CategoryGrid from "@/components/public/CategoryGrid";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let featuredArticle: Record<string, unknown> | null = null;
  let latestArticles: Record<string, unknown>[] = [];
  let categories: (Record<string, unknown> & { _count: { articles: number } })[] = [];

  try {
    const rawFeatured = await articlesRepo.getFeaturedArticle();
    if (rawFeatured) {
      const author = rawFeatured.authorId ? await usersRepo.getUser(rawFeatured.authorId as string) : null;
      const category = rawFeatured.categoryId ? await categoriesRepo.getCategory(rawFeatured.categoryId as string) : null;
      featuredArticle = { ...rawFeatured, author, category } as Record<string, unknown>;
    }
  } catch {
    // Index may not be created yet
  }

  try {
    const rawLatest = await articlesRepo.getPublishedArticles(12);
    latestArticles = await Promise.all(
      rawLatest.map(async (article) => {
        const author = article.authorId ? await usersRepo.getUser(article.authorId as string) : null;
        const category = article.categoryId ? await categoriesRepo.getCategory(article.categoryId as string) : null;
        return { ...article, author, category } as Record<string, unknown>;
      })
    );
  } catch {
    // Index may not be created yet
  }

  try {
    categories = await categoriesRepo.getCategoriesWithCounts(true);
  } catch {
    // Fallback to empty
  }

  const headlineArticles = latestArticles.slice(0, 3);
  const recentArticles = latestArticles.slice(3, 9);

  return (
    <>
      <HeroSection
        article={
          featuredArticle
            ? {
                title: featuredArticle.title as string,
                slug: featuredArticle.slug as string,
                excerpt: featuredArticle.excerpt as string | null,
                coverImage: featuredArticle.coverImage as string | null,
                coverImageFirebaseUrl: featuredArticle.coverImageFirebaseUrl as string | null,
                publishedAt: featuredArticle.publishedAt as string | null,
                category: featuredArticle.category as { name: string; slug: string } | null,
                author: featuredArticle.author as { name: string | null } | null,
              }
            : undefined
        }
      />

      <div className="newspaper-shell">
        <div className="grid gap-10 lg:grid-cols-[1fr_280px] lg:gap-12">
          <div className="min-w-0">
            {headlineArticles.length > 0 && (
              <section className="mb-14 sm:mb-20">
                <div className="mb-6 flex items-end justify-between border-t-2 border-border-strong pt-3">
                  <div>
                    <p className="section-kicker mb-2">Aujourd&apos;hui</p>
                    <h2 className="font-headline text-3xl font-extrabold leading-none text-foreground sm:text-4xl">
                      Derniers articles
                    </h2>
                  </div>
                  <Link href="/categories" className="hidden font-label text-xs font-extrabold uppercase text-foreground transition-colors hover:text-primary sm:block">
                    Voir tout
                  </Link>
                </div>

                <div className="grid gap-7 md:grid-cols-3 md:gap-6">
                  {headlineArticles.map((article, index) => (
                    <div
                      key={String(article.id)}
                      className={index === 0 ? "md:col-span-2 md:border-r md:border-border-subtle md:pr-6" : ""}
                    >
                      <ArticleCard
                        article={{
                          title: article.title as string,
                          slug: article.slug as string,
                          excerpt: article.excerpt as string | null,
                          coverImage: article.coverImage as string | null,
                          coverImageFirebaseUrl: article.coverImageFirebaseUrl as string | null,
                          publishedAt: article.publishedAt as string | null,
                          author: article.author as { name: string | null } | null,
                          category: article.category as { name: string; slug: string } | null,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {recentArticles.length > 0 && (
              <section className="mb-14 sm:mb-20">
                <div className="mb-2 border-t-2 border-border-strong pt-3">
                  <p className="section-kicker mb-2">Analyse</p>
                  <h2 className="font-headline text-3xl font-extrabold leading-none text-foreground sm:text-4xl">
                    Le fil éditorial
                  </h2>
                </div>
                <div className="divide-y divide-border-subtle">
                  {recentArticles.map((article) => (
                    <ArticleCard
                      key={String(article.id)}
                      variant="list"
                      article={{
                        title: article.title as string,
                        slug: article.slug as string,
                        excerpt: article.excerpt as string | null,
                        coverImage: article.coverImage as string | null,
                        coverImageFirebaseUrl: article.coverImageFirebaseUrl as string | null,
                        publishedAt: article.publishedAt as string | null,
                        author: article.author as { name: string | null } | null,
                        category: article.category as { name: string; slug: string } | null,
                      }}
                    />
                  ))}
                </div>
              </section>
            )}

            {latestArticles.length === 0 && (
              <div className="border-t-2 border-border-strong py-16 text-center">
                <p className="font-body text-lg text-muted">
                  Aucun article publié pour le moment. Revenez bientôt.
                </p>
              </div>
            )}
          </div>

          {categories.length > 0 && (
            <aside className="hidden h-fit border-t-2 border-border-strong pt-4 lg:sticky lg:top-40 lg:block">
              <div className="mb-5">
                <p className="section-kicker mb-2">Rubriques</p>
                <h3 className="font-headline text-2xl font-extrabold text-foreground">Parcourir</h3>
              </div>
              <CategoryGrid categories={categories.map(c => ({
                name: c.name as string,
                slug: c.slug as string,
                description: c.description as string | null,
                _count: c._count as { articles: number },
              }))} />

              <div className="mt-8 border border-border-strong p-5">
                <p className="page-kicker mb-3">Édition</p>
                <h4 className="mb-4 font-headline text-2xl font-extrabold leading-tight text-foreground">
                  Recevez la lecture du jour.
                </h4>
                <Link
                  href="/signup"
                  className="block border border-border-strong bg-foreground py-3 text-center font-label text-xs font-extrabold uppercase text-background transition-colors hover:bg-primary hover:text-white"
                >
                  S&apos;abonner
                </Link>
              </div>
            </aside>
          )}
        </div>
      </div>

      {categories.length > 0 && (
        <section className="newspaper-shell pb-16 sm:pb-20 lg:hidden">
          <div className="mb-6 border-t-2 border-border-strong pt-3">
            <p className="section-kicker mb-2">Rubriques</p>
            <h2 className="font-headline text-3xl font-extrabold leading-none text-foreground">Catégories</h2>
          </div>
          <CategoryGrid variant="grid" categories={categories.map(c => ({
            name: c.name as string,
            slug: c.slug as string,
            description: c.description as string | null,
            _count: c._count as { articles: number },
          }))} />
        </section>
      )}
    </>
  );
}
