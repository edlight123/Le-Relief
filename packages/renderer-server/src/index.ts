/**
 * Cloud Run / GitHub Action HTTP wrapper around @le-relief/renderer.
 *
 * Exposes:
 *   POST /render        body: { article, platforms }
 *                       returns: { brandName, warnings, platforms: { [id]: { slides:[{slideNumber,pngBase64,format,width,height}], caption, firstComment, thread, meta } } }
 *   GET  /healthz
 *
 * Auth: Bearer token via env RENDERER_AUTH_TOKEN (optional).
 */

import express from "express";
import {
  buildPost,
  renderPost,
  getPlatformSpec,
  formatForPlatform,
  closeBrowserInstance,
  getBrand,
  setBrand,
  resetBrand,
} from "@le-relief/renderer";
import type { PlatformId } from "@le-relief/types";

const app = express();
app.use(express.json({ limit: "5mb" }));

const PORT = Number(process.env.PORT ?? 8080);
const TOKEN = process.env.RENDERER_AUTH_TOKEN;

app.use((req, res, next) => {
  if (!TOKEN || req.path === "/healthz") return next();
  // Two valid auth modes:
  //   1. `Authorization: Bearer <RENDERER_AUTH_TOKEN>` — legacy / dev.
  //   2. `x-renderer-token: <RENDERER_AUTH_TOKEN>` — used when the
  //      `Authorization` header carries a Google-signed ID token (Cloud
  //      Run IAM has already validated it). The shared secret then acts
  //      as defense in depth.
  const auth = req.headers.authorization ?? "";
  const xToken = (req.headers["x-renderer-token"] as string | undefined) ?? "";
  // If a Google ID token is present we trust Cloud Run's IAM gate and
  // only require the shared secret in the side-channel header.
  const isGoogleIdToken = auth.startsWith("Bearer eyJ");
  if (isGoogleIdToken) {
    if (xToken === TOKEN) return next();
  } else if (auth === `Bearer ${TOKEN}`) {
    return next();
  }
  res.status(401).json({ error: "unauthorized" });
});

app.get("/healthz", (_req, res) => {
  res.json({ ok: true, brand: getBrand().name });
});

interface RenderRequest {
  article: {
    id: string;
    title: string;
    subtitle?: string;
    excerpt?: string;
    body: string;
    slug: string;
    language?: "fr" | "en";
    contentType?: string;
    isBreaking?: boolean;
    author?: { name?: string };
    category?: { slug?: string };
  };
  platforms: PlatformId[];
}

app.post("/render", async (req, res) => {
  const body = req.body as RenderRequest;
  if (!body?.article || !Array.isArray(body?.platforms)) {
    res.status(400).json({ error: "article + platforms required" });
    return;
  }
  // Inline import — same code path as the Next.js inline mode lives in
  // src/lib/social/article-to-post.ts. We re-implement a tiny version here
  // to avoid pulling Next deps into the worker.
  try {
    const { intake, rawSlides, caption, contentType } = articleToContent(body.article);

    resetBrand();
    if (body.article.language === "en") {
      setBrand({
        labels: { sourceCredit: "Source", readMore: "Read on lereliefhaiti.com" },
      } as unknown as Parameters<typeof setBrand>[0]);
    }
    const built = buildPost({ intake, rawSlides, caption });
    const warnings = [...built.overflowWarnings];
    const post = built.post;
    const brand = getBrand();
    const out: Record<string, unknown> = {};

    for (const platform of body.platforms) {
      const spec = getPlatformSpec(platform);
      const subset = {
        ...post,
        slides:
          spec.carousel === null
            ? post.slides.slice(0, 1)
            : post.slides.slice(0, Math.min(post.slides.length, spec.carousel.max)),
      };
      try {
        const rendered = await renderPost(subset, contentType, platform);
        const adapted = formatForPlatform(platform, { post: subset });
        out[platform] = {
          slides: rendered.map((s) => ({
            slideNumber: s.slideNumber,
            pngBase64: s.png.toString("base64"),
            format: s.format,
            width: s.widthPx,
            height: s.heightPx,
          })),
          caption: adapted.caption,
          firstComment: adapted.firstComment ?? null,
          thread: adapted.thread ?? null,
          meta: adapted.meta ?? null,
        };
      } catch (err) {
        warnings.push(`${platform}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    await closeBrowserInstance();
    resetBrand();
    res.json({ brandName: brand.name, warnings, platforms: out });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

function articleToContent(a: RenderRequest["article"]) {
  const language: "fr" | "en" = a.language === "en" ? "en" : "fr";
  const isFr = language === "fr";
  const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://lereliefhaiti.com";
  const sourceLine = a.author?.name
    ? `${isFr ? "Par" : "By"} ${a.author.name}`
    : isFr
      ? "Rédaction Le Relief"
      : "Le Relief Newsroom";
  const stripHtml = (s = "") => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const headline = a.title.trim();
  const supportLine = (a.subtitle || a.excerpt || "").trim();
  const detailBody = stripHtml(a.body).slice(0, 260);
  const articleUrl = `${SITE}${isFr ? "" : "/en"}/articles/${a.slug}`;
  return {
    intake: {
      topic: headline,
      sourceSummary: stripHtml(a.excerpt) || stripHtml(a.body).slice(0, 400),
      category: a.category?.slug || "news",
      preferredLanguage: language,
      urgencyLevel: (a.isBreaking ? "breaking" : "normal") as "breaking" | "normal",
      sourceNote: sourceLine,
    },
    rawSlides: [
      { slideNumber: 1, headline, supportLine: supportLine || undefined, sourceLine, layoutVariant: "cover" as const },
      { slideNumber: 2, headline: isFr ? "L'essentiel" : "Key points", body: detailBody, sourceLine, layoutVariant: "detail" as const },
      { slideNumber: 3, headline: isFr ? "Lire l'article" : "Read more", supportLine: `${isFr ? "Lire sur" : "Read on"} ${SITE.replace(/^https?:\/\//, "")}.`, sourceLine, layoutVariant: "cta" as const },
    ],
    caption: {
      text: [headline, "", stripHtml(a.excerpt) || stripHtml(a.body).slice(0, 320), "", `${isFr ? "👉" : "→"} ${articleUrl}`].join("\n"),
      cta: articleUrl,
      hashtags: ["#LeRelief", "#Haïti", isFr ? "#Actualités" : "#News"],
    },
    contentType: a.contentType || (a.isBreaking ? "breaking" : "news"),
  };
}

app.listen(PORT, () => {
  console.log(`[renderer-server] listening on :${PORT}`);
});
