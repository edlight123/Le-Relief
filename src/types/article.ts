export type ArticleStatus = "draft" | "pending_review" | "published";
export type ArticleLanguage = "fr" | "en";
export type ArticleContentType =
  | "actualite"
  | "analyse"
  | "opinion"
  | "editorial"
  | "tribune"
  | "dossier"
  | "fact_check"
  | "emission_speciale";

export type ArticleTranslationStatus =
  | "not_applicable"
  | "not_started"
  | "generated_draft"
  | "in_review"
  | "approved"
  | "published"
  | "rejected";

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
  contentType: ArticleContentType;
  language: ArticleLanguage;
  translationStatus: ArticleTranslationStatus;
  isCanonicalSource: boolean;
  sourceArticleId: string | null;
  alternateLanguageSlug: string | null;
  allowTranslation: boolean;
  translationPriority: string | null;
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
  contentType?: ArticleContentType;
  language?: ArticleLanguage;
  translationStatus?: ArticleTranslationStatus;
  isCanonicalSource?: boolean;
  sourceArticleId?: string | null;
  alternateLanguageSlug?: string | null;
  allowTranslation?: boolean;
  translationPriority?: string | null;
}

export interface UpdateArticleInput extends Partial<CreateArticleInput> {
  id: string;
}
