import { getUnresolvedBlockingComments } from "@/lib/repositories/editorial/comments";

export async function validatePublishReadiness(input: {
  articleId: string;
  title?: string | null;
  body?: string | null;
  excerpt?: string | null;
  coverImage?: string | null;
  categoryId?: string | null;
  contentType?: string | null;
  slug?: string | null;
  seoTitle?: string | null;
  metaDescription?: string | null;
}) {
  const errors: string[] = [];

  if (!input.title?.trim()) errors.push("Titre requis");
  if (!input.body?.trim()) errors.push("Corps requis");
  if (!input.excerpt?.trim()) errors.push("Chapô requis");
  if (!input.coverImage?.trim()) errors.push("Image principale requise");
  if (!input.categoryId?.trim()) errors.push("Rubrique requise");
  if (!input.contentType?.trim()) errors.push("Type de contenu requis");

  const candidateSlug = input.slug?.trim() || input.title?.trim() || "";
  if (!candidateSlug) {
    errors.push("Slug requis");
  }

  if (!input.seoTitle?.trim()) errors.push("SEO title requis");
  if (!input.metaDescription?.trim()) errors.push("Meta description requise");

  const unresolvedBlocking = await getUnresolvedBlockingComments(input.articleId);
  if (unresolvedBlocking.length > 0) {
    errors.push("Commentaires bloquants non résolus");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
