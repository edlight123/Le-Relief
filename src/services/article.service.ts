import * as articlesRepo from "@/lib/repositories/articles";
import { generateSlug } from "@/lib/slug";

export async function getArticles(options?: {
  status?: string;
  search?: string;
  take?: number;
  skip?: number;
}) {
  const { articles } = await articlesRepo.getArticles(options);
  // Hydrate author and category
  const { usersRepo, categoriesRepo } = await import("@/lib/repositories");
  return Promise.all(
    articles.map(async (article) => {
      const author = article.authorId
        ? await usersRepo.getUser(article.authorId as string)
        : null;
      const category = article.categoryId
        ? await categoriesRepo.getCategory(article.categoryId as string)
        : null;
      return { ...article, author, category } as Record<string, unknown>;
    })
  );
}

export async function getArticleBySlug(slug: string) {
  const article = await articlesRepo.findBySlug(slug);
  if (!article) return null;
  const { usersRepo, categoriesRepo } = await import("@/lib/repositories");
  const author = article.authorId
    ? await usersRepo.getUser(article.authorId as string)
    : null;
  const category = article.categoryId
    ? await categoriesRepo.getCategory(article.categoryId as string)
    : null;
  return { ...article, author, category } as Record<string, unknown>;
}

export async function createArticle(data: {
  title: string;
  subtitle?: string;
  body: string;
  excerpt?: string;
  coverImage?: string;
  categoryId?: string;
  status?: string;
  featured?: boolean;
  authorId: string;
}) {
  const slug = generateSlug(data.title);
  return articlesRepo.createArticle({
    ...data,
    slug,
    subtitle: data.subtitle || null,
    excerpt: data.excerpt || null,
    coverImage: data.coverImage || null,
    categoryId: data.categoryId || null,
    status: data.status || "draft",
    featured: data.featured || false,
    publishedAt: data.status === "published" ? new Date() : null,
  });
}
