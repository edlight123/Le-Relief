import { z } from "zod";

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
  coverImage: z.string().optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["draft", "published"]).optional(),
  featured: z.boolean().optional(),
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
  alternateLanguageSlug: z.string().optional(),
  allowTranslation: z.boolean().optional(),
  translationPriority: z.string().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100),
  description: z.string().max(500).optional(),
});
