export type ArticleStatus = "draft" | "pending_review" | "published";

export interface Article {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  body: string;
  excerpt: string | null;
  coverImage: string | null;
  status: ArticleStatus;
  featured: boolean;
  views: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  categoryId: string | null;
  author?: { id: string; name: string | null; image: string | null };
  category?: { id: string; name: string; slug: string } | null;
  tags?: string[];
}

export interface CreateArticleInput {
  title: string;
  subtitle?: string;
  body: string;
  excerpt?: string;
  coverImage?: string;
  categoryId?: string;
  tags?: string[];
  status?: ArticleStatus;
  featured?: boolean;
}

export interface UpdateArticleInput extends Partial<CreateArticleInput> {
  id: string;
}
