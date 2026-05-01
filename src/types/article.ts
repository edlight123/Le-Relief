export type ArticleStatus =
  | "draft"
  | "writing"
  | "in_review"
  | "revisions_requested"
  | "approved"
  | "scheduled"
  | "published"
  | "rejected"
  | "archived"
  | "pending_review";
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

interface ArticleBase {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  body: string;
  excerpt: string | null;
  keyPoints: string[] | null;
  context: string | null;
  sources: Array<{ title: string; url: string }> | null;
  seoTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  coverImage: string | null;
  status: ArticleStatus;
  featured: boolean;
  priorityLevel: string | null;
  isBreaking: boolean;
  isHomepagePinned: boolean;
  views: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  categoryId: string | null;
  contentType: ArticleContentType;
  alternateLanguageSlug: string | null;
  allowTranslation: boolean;
  translationPriority: string | null;
  submittedForReviewAt: Date | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  publishedBy: string | null;
  revisionRequestedBy: string | null;
  revisionRequestedAt: Date | null;
  rejectedBy: string | null;
  rejectedAt: Date | null;
  author?: { id: string; name: string | null; image: string | null };
  category?: { id: string; name: string; slug: string } | null;
  tags?: string[];
}

export interface FrenchArticle extends ArticleBase {
  language: "fr";
  isCanonicalSource: true;
  sourceArticleId: null;
  translationStatus: "not_applicable";
}

export interface EnglishArticle extends ArticleBase {
  language: "en";
  isCanonicalSource: false;
  sourceArticleId: string;
  translationStatus:
    | "not_started"
    | "generated_draft"
    | "in_review"
    | "approved"
    | "published"
    | "rejected";
}

export type Article = FrenchArticle | EnglishArticle;

interface CreateArticleInputBase {
  title: string;
  subtitle?: string | null;
  body: string;
  excerpt?: string | null;
  keyPoints?: string[] | null;
  context?: string | null;
  sources?: Array<{ title: string; url: string }> | null;
  coverImage?: string | null;
  seoTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  categoryId?: string | null;
  tags?: string[];
  status?: ArticleStatus;
  featured?: boolean;
  priorityLevel?: string | null;
  isBreaking?: boolean;
  isHomepagePinned?: boolean;
  contentType?: ArticleContentType;
  alternateLanguageSlug?: string | null;
  allowTranslation?: boolean;
  translationPriority?: string | null;
  coAuthors?: string[];
  assignedTo?: string | null;
}

export type CreateFrenchArticleInput = CreateArticleInputBase & {
  language?: "fr";
  isCanonicalSource?: true;
  sourceArticleId?: null;
  translationStatus?: "not_applicable";
};

export type CreateEnglishArticleInput = CreateArticleInputBase & {
  language: "en";
  isCanonicalSource?: false;
  sourceArticleId: string;
  translationStatus?:
    | "not_started"
    | "generated_draft"
    | "in_review"
    | "approved"
    | "published"
    | "rejected";
};

export type CreateArticleInput =
  | CreateFrenchArticleInput
  | CreateEnglishArticleInput;

type UpdateFrenchArticleInput = Partial<CreateFrenchArticleInput> & {
  language?: "fr";
  sourceArticleId?: null;
};

type UpdateEnglishArticleInput = Partial<CreateEnglishArticleInput> & {
  language: "en";
  sourceArticleId: string;
};

export type UpdateArticleInput = (UpdateFrenchArticleInput | UpdateEnglishArticleInput) & {
  id: string;
};
