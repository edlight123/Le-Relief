import { db } from "@/lib/db";
import { generateSlug } from "@/lib/slug";

export async function getArticles(options?: {
  status?: string;
  search?: string;
  take?: number;
  skip?: number;
}) {
  const where: Record<string, unknown> = {};
  if (options?.status) where.status = options.status;
  if (options?.search) {
    where.OR = [
      { title: { contains: options.search } },
      { body: { contains: options.search } },
    ];
  }

  return db.article.findMany({
    where,
    include: {
      author: { select: { id: true, name: true, image: true } },
      category: true,
    },
    orderBy: { updatedAt: "desc" },
    take: options?.take || 20,
    skip: options?.skip || 0,
  });
}

export async function getArticleBySlug(slug: string) {
  return db.article.findUnique({
    where: { slug },
    include: {
      author: { select: { id: true, name: true, image: true } },
      category: true,
      tags: { include: { tag: true } },
    },
  });
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
  return db.article.create({
    data: {
      ...data,
      slug,
      subtitle: data.subtitle || null,
      excerpt: data.excerpt || null,
      coverImage: data.coverImage || null,
      categoryId: data.categoryId || null,
      status: data.status || "draft",
      featured: data.featured || false,
      publishedAt: data.status === "published" ? new Date() : null,
    },
  });
}
