/**
 * AI-assisted slide generation using the DeepSeek API (OpenAI-compatible).
 *
 * Toggled by `SOCIAL_AI_ENABLED=true` — returns null immediately if not set.
 * Requires `DEEPSEEK_API_KEY`. Respects `DEEPSEEK_MODEL` and
 * `DEEPSEEK_BASE_URL` (same env vars used by the translation layer).
 * Soft-fails (returns null) on any error or 15-second timeout.
 */

import type { SlideContent, PostCaption } from "@le-relief/renderer";

export interface AISlideInput {
  title: string;
  excerpt?: string;
  body: string;
  category: string;
  language: "fr" | "en";
  isBreaking: boolean;
  articleUrl: string;
}

interface OpenAIMessage {
  role: string;
  content: string;
}
interface OpenAIChatResponse {
  choices?: Array<{ message?: OpenAIMessage }>;
}

const DEEPSEEK_DEFAULT_BASE_URL = "https://api.deepseek.com/v1";
const DEEPSEEK_DEFAULT_MODEL = "deepseek-chat";

export async function generateAISlides(
  input: AISlideInput,
): Promise<{ slides: SlideContent[]; caption: PostCaption } | null> {
  if (process.env.SOCIAL_AI_ENABLED !== "true") return null;

  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) return null;

  const model = process.env.DEEPSEEK_MODEL?.trim() || DEEPSEEK_DEFAULT_MODEL;
  const baseUrl = (process.env.DEEPSEEK_BASE_URL?.trim() || DEEPSEEK_DEFAULT_BASE_URL).replace(/\/$/, "");
  const url = `${baseUrl}/chat/completions`;

  const isFr = input.language !== "en";

  const systemPrompt = `Tu es un rédacteur senior pour Le Relief, un média d'information haïtien professionnel et indépendant. 
Tu crées des contenus de qualité éditoriale pour les réseaux sociaux.
Règles impératives :
- Écris en français professionnel, sauf si la langue est explicitement "en".
- Ne jamais ajouter de faits absents du texte source.
- Pas de sensationnalisme.
- Les titres de slides doivent contenir 12 mots maximum.
- Le corps des slides doit contenir 50 mots maximum.
- Réponds uniquement en JSON strict, aucun texte en dehors du JSON.`;

  const stripHtml = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const bodyClean = stripHtml(input.body).slice(0, 1200);
  const excerptClean = input.excerpt ? stripHtml(input.excerpt) : "";

  const userPrompt = `Article à mettre en slides :

Titre : ${input.title}
Catégorie : ${input.category}
${excerptClean ? `Résumé : ${excerptClean}\n` : ""}Contenu : ${bodyClean}
URL : ${input.articleUrl}
${input.isBreaking ? "⚠️ Article urgent / Flash" : ""}

Génère exactement ce JSON (rien d'autre) :
{
  "slides": [
    { "slideNumber": 1, "headline": "...", "supportLine": "...", "layoutVariant": "cover" },
    { "slideNumber": 2, "headline": "${isFr ? "L'essentiel" : "Key Points"}", "body": "...", "layoutVariant": "detail" },
    { "slideNumber": 3, "headline": "${isFr ? "Pourquoi c'est important" : "Why It Matters"}", "body": "...", "layoutVariant": "detail" },
    { "slideNumber": 4, "headline": "${isFr ? "Lire l'article" : "Read More"}", "supportLine": "lereliefhaiti.com", "layoutVariant": "cta" }
  ],
  "caption": {
    "text": "...",
    "shortText": "...",
    "cta": "${input.articleUrl}",
    "hashtags": ["#LeRelief", "#Haïti", "#Haiti"]
  }
}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) return null;

    const raw = await response.text();
    let parsed: OpenAIChatResponse;
    try {
      parsed = JSON.parse(raw) as OpenAIChatResponse;
    } catch {
      return null;
    }

    const content = parsed.choices?.[0]?.message?.content?.trim() ?? "";
    if (!content) return null;

    // Strip markdown code fences if the model wraps the JSON
    const jsonText = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

    let result: { slides: SlideContent[]; caption: PostCaption };
    try {
      result = JSON.parse(jsonText) as { slides: SlideContent[]; caption: PostCaption };
    } catch {
      return null;
    }

    if (!Array.isArray(result.slides) || result.slides.length === 0) return null;
    if (!result.caption?.text) return null;

    // Ensure hashtags always includes Le Relief branding
    if (!Array.isArray(result.caption.hashtags)) {
      result.caption.hashtags = ["#LeRelief", "#Haïti", "#Haiti"];
    }

    return result;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
