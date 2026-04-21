import { buildFrenchToEnglishTranslationPrompts } from "@/lib/ai/prompts";
import type {
  TranslationInput,
  TranslationModelJson,
  TranslationPromptOptions,
  TranslationProvider,
  TranslationResult,
} from "@/lib/ai/types";

const OPENAI_DEFAULT_BASE_URL = "https://api.openai.com/v1";
const OPENAI_DEFAULT_MODEL = "gpt-4.1-mini";
const GEMINI_DEFAULT_MODEL = "gemini-2.0-flash";

const REQUIRED_OUTPUT_KEYS: Array<keyof TranslationModelJson> = [
  "titleEn",
  "subtitleEn",
  "excerptEn",
  "bodyEn",
  "seoTitleEn",
  "seoDescriptionEn",
  "summaryEn",
];

interface OpenAiChatResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

function getProviderFromEnv(): TranslationProvider {
  const provider = process.env.TRANSLATION_PROVIDER?.trim().toLowerCase();

  if (!provider) {
    throw new Error(
      "Missing TRANSLATION_PROVIDER. Set TRANSLATION_PROVIDER=openai or TRANSLATION_PROVIDER=gemini.",
    );
  }

  if (provider !== "openai" && provider !== "gemini") {
    throw new Error(
      `Unsupported TRANSLATION_PROVIDER=\"${provider}\". Allowed values: openai, gemini.`,
    );
  }

  return provider;
}

function extractTextFromOpenAiContent(
  content: string | Array<{ type?: string; text?: string }> | undefined,
): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part.text === "string" ? part.text : ""))
      .join("")
      .trim();
  }

  return "";
}

function extractJsonString(rawText: string): string {
  const trimmed = rawText.trim();
  if (!trimmed) {
    throw new Error("AI provider returned an empty response.");
  }

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const codeFenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeFenceMatch?.[1]) {
    const fenced = codeFenceMatch[1].trim();
    if (fenced.startsWith("{") && fenced.endsWith("}")) {
      return fenced;
    }
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  throw new Error("AI provider response did not contain a valid JSON object.");
}

function parseTranslationJson(rawText: string): TranslationModelJson {
  const jsonString = extractJsonString(rawText);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error("Failed to parse translation JSON from AI provider response.");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Translation JSON contract violation: expected a top-level object.");
  }

  const obj = parsed as Record<string, unknown>;
  const output: Partial<TranslationModelJson> = {};

  for (const key of REQUIRED_OUTPUT_KEYS) {
    const value = obj[key];
    if (typeof value !== "string") {
      throw new Error(
        `Translation JSON contract violation: key \"${key}\" must be a string.`,
      );
    }
    output[key] = value;
  }

  return output as TranslationModelJson;
}

async function callOpenAiCompatible(
  systemPrompt: string,
  userPrompt: string,
): Promise<{ model: string; text: string; rawResponse: string }> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY for TRANSLATION_PROVIDER=openai.");
  }

  const model = process.env.OPENAI_MODEL?.trim() || OPENAI_DEFAULT_MODEL;
  const baseUrl = (process.env.OPENAI_BASE_URL?.trim() || OPENAI_DEFAULT_BASE_URL).replace(/\/$/, "");
  const url = `${baseUrl}/chat/completions`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  const rawResponse = await response.text();
  if (!response.ok) {
    throw new Error(
      `OpenAI-compatible translation request failed (${response.status}): ${rawResponse}`,
    );
  }

  let parsed: OpenAiChatResponse;
  try {
    parsed = JSON.parse(rawResponse) as OpenAiChatResponse;
  } catch {
    throw new Error("OpenAI-compatible provider returned non-JSON HTTP response.");
  }

  const text = extractTextFromOpenAiContent(parsed.choices?.[0]?.message?.content);
  if (!text) {
    throw new Error("OpenAI-compatible provider returned no message content.");
  }

  return { model, text, rawResponse };
}

async function callGeminiCompatible(
  systemPrompt: string,
  userPrompt: string,
): Promise<{ model: string; text: string; rawResponse: string }> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY for TRANSLATION_PROVIDER=gemini.");
  }

  const model = process.env.GEMINI_MODEL?.trim() || GEMINI_DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  const rawResponse = await response.text();
  if (!response.ok) {
    throw new Error(`Gemini-compatible translation request failed (${response.status}): ${rawResponse}`);
  }

  let parsed: GeminiResponse;
  try {
    parsed = JSON.parse(rawResponse) as GeminiResponse;
  } catch {
    throw new Error("Gemini-compatible provider returned non-JSON HTTP response.");
  }

  const text =
    parsed.candidates?.[0]?.content?.parts
      ?.map((part) => (typeof part.text === "string" ? part.text : ""))
      .join("")
      .trim() || "";

  if (!text) {
    throw new Error("Gemini-compatible provider returned no candidate content.");
  }

  return { model, text, rawResponse };
}

export async function translateFrenchArticleToEnglish(
  input: TranslationInput,
  options: TranslationPromptOptions = {},
): Promise<TranslationResult> {
  const { systemPrompt, userPrompt, promptVersion } =
    buildFrenchToEnglishTranslationPrompts(input, options);
  const provider = getProviderFromEnv();

  const providerResult =
    provider === "openai"
      ? await callOpenAiCompatible(systemPrompt, userPrompt)
      : await callGeminiCompatible(systemPrompt, userPrompt);

  const parsed = parseTranslationJson(providerResult.text);

  return {
    ...parsed,
    provider,
    model: providerResult.model,
    promptVersion,
    rawResponse: providerResult.rawResponse,
  };
}
