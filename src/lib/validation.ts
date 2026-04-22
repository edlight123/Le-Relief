import { z } from "zod";
import { getDb } from "@/lib/firebase";

export const loginSchema = z.object({
  email: z.string().email("Adresse courriel invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export const signupSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Adresse courriel invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export const articleSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(200),
  subtitle: z.string().max(300).optional(),
  body: z.string().min(1, "Le contenu est requis"),
  excerpt: z.string().max(500).optional(),
  slug: z.string().max(220).optional(),
  seoTitle: z.string().max(220).optional(),
  metaDescription: z.string().max(320).optional(),
  canonicalUrl: z.string().url().optional(),
  coverImage: z.string().optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z
    .enum([
      "draft",
      "writing",
      "in_review",
      "revisions_requested",
      "approved",
      "scheduled",
      "published",
      "rejected",
      "archived",
      "pending_review",
    ])
    .optional(),
  featured: z.boolean().optional(),
  scheduledAt: z.string().optional(),
  contentType: z
    .enum([
      "actualite",
      "analyse",
      "opinion",
      "editorial",
      "tribune",
      "dossier",
      "fact_check",
      "emission_speciale",
    ])
    .optional(),
  language: z.enum(["fr", "en"]).optional(),
  translationStatus: z
    .enum([
      "not_applicable",
      "not_started",
      "generated_draft",
      "in_review",
      "approved",
      "published",
      "rejected",
    ])
    .optional(),
  isCanonicalSource: z.boolean().optional(),
  sourceArticleId: z.string().nullable().optional(),
  alternateLanguageSlug: z.string().optional(),
  allowTranslation: z.boolean().optional(),
  translationPriority: z.string().optional(),
}).superRefine(async (data, ctx) => {
  const result = await validateSourceArticleReference(data.language ?? "fr", data.sourceArticleId);
  if (!result.valid) {
    ctx.addIssue({
      code: "custom",
      path: ["sourceArticleId"],
      message: result.error ?? "Référence de l'article source invalide",
    });
  }

  if ((data.language ?? "fr") === "fr" && data.translationStatus && data.translationStatus !== "not_applicable") {
    ctx.addIssue({
      code: "custom",
      path: ["translationStatus"],
      message: "Un article FR doit avoir translationStatus='not_applicable'",
    });
  }

  if ((data.language ?? "fr") === "en" && data.translationStatus === "not_applicable") {
    ctx.addIssue({
      code: "custom",
      path: ["translationStatus"],
      message: "Un article EN ne peut pas avoir translationStatus='not_applicable'",
    });
  }
});

export async function validateSourceArticleReference(
  language: string,
  sourceArticleId: string | null | undefined,
): Promise<{ valid: boolean; error?: string }> {
  if (language === "fr") {
    if (sourceArticleId) {
      return {
        valid: false,
        error: "Les articles FR ne peuvent pas définir sourceArticleId.",
      };
    }
    return { valid: true };
  }

  if (language !== "en") {
    return { valid: false, error: "Langue invalide. Valeurs autorisées: fr, en." };
  }

  if (!sourceArticleId) {
    return {
      valid: false,
      error: "Un article EN doit référencer un article source FR publié.",
    };
  }

  const snap = await getDb().collection("articles").doc(sourceArticleId).get();
  if (!snap.exists) {
    return {
      valid: false,
      error: "sourceArticleId ne référence aucun article existant.",
    };
  }

  const source = snap.data() as {
    language?: string;
    isCanonicalSource?: boolean;
    sourceArticleId?: string | null;
    status?: string;
  };

  if (source.language !== "fr") {
    return {
      valid: false,
      error: "sourceArticleId doit référencer un article en français (language='fr').",
    };
  }

  if (source.isCanonicalSource !== true) {
    return {
      valid: false,
      error: "L'article source référencé doit avoir isCanonicalSource=true.",
    };
  }

  if (source.sourceArticleId) {
    return {
      valid: false,
      error: "L'article source référencé ne peut pas être lui-même une traduction.",
    };
  }

  if (source.status !== "published") {
    return {
      valid: false,
      error: "L'article source FR doit être publié avant création d'une traduction EN.",
    };
  }

  return { valid: true };
}

export const categorySchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100),
  description: z.string().max(500).optional(),
});

export const homepageSettingsSchema = z.object({
  heroArticleId: z.string().nullable().optional(),
  secondaryArticleIds: z.array(z.string()).max(3).optional(),
  highlightedCategoryIds: z.array(z.string()).max(12).optional(),
  showNewsletter: z.boolean().optional(),
  showEnglishSelection: z.boolean().optional(),
});
