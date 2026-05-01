/**
 * End-to-end smoke test for the social media renderer.
 *
 * Tests the full pipeline:
 *   Article fixture → buildPost → renderPost → image file
 *
 * Covers:
 *   - breaking-news-single  (isBreaking)
 *   - news-carousel         (default article, 3 slides)
 *   - caricature-card       (category: caricature, single slide)
 *   - explainer-carousel    (category: analyse)
 *
 * Usage:
 *   pnpm tsx scripts/test-renderer-e2e.ts
 *
 * Output images land in /tmp/renderer-e2e/
 */

import { mkdirSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  buildPost,
  renderPost,
  closeBrowserInstance,
} from "../packages/renderer/src/index.js";

// ── Article fixtures ───────────────────────────────────────────────────────

interface ArticleFixture {
  label: string;
  article: {
    id: string;
    title: string;
    subtitle?: string;
    excerpt?: string;
    body: string;
    slug: string;
    language?: "fr" | "en";
    isBreaking?: boolean;
    contentType?: string;
    coverImage?: string;
    author?: { name: string };
    category?: { slug: string };
  };
  platforms: string[];
}

const FIXTURES: ArticleFixture[] = [
  {
    label: "breaking-news",
    article: {
      id: "test-breaking",
      title: "FLASH — Séisme de magnitude 6.1 ressenti à Port-au-Prince",
      excerpt:
        "Un séisme de magnitude 6.1 a été ressenti ce matin dans la région métropolitaine de Port-au-Prince, selon l'USGS.",
      body: "Un séisme de magnitude 6.1 a été ressenti ce matin dans la région métropolitaine de Port-au-Prince. Les premières informations font état de dégâts matériels dans certains quartiers.",
      slug: "seisme-magnitude-61-port-au-prince",
      language: "fr",
      isBreaking: true,
      category: { slug: "securite" },
    },
    platforms: ["instagram-feed"],
  },
  {
    label: "news-carousel",
    article: {
      id: "test-news",
      title: "Le gouvernement haïtien annonce un nouveau plan économique pour 2026",
      subtitle: "Un programme ambitieux axé sur la relance agricole et touristique",
      excerpt:
        "Le Premier ministre a présenté ce lundi un plan de relance économique national ciblant les secteurs agricole, touristique et industriel.",
      body: "Le Premier ministre a présenté ce lundi un plan de relance économique national. Ce plan, fruit de mois de consultations, cible principalement les secteurs agricole, touristique et industriel. L'objectif est de créer 50 000 emplois d'ici fin 2027.",
      slug: "plan-economique-2026-haiti",
      language: "fr",
      category: { slug: "economie" },
      author: { name: "Jean-Michel Lebrun" },
    },
    platforms: ["instagram-feed"],
  },
  {
    label: "caricature-card",
    article: {
      id: "test-caricature",
      title: "Caricature du jour — politique et réalité",
      excerpt: "La caricature politique de la semaine par Francisco Silva.",
      body: "Caricature politique hebdomadaire.",
      slug: "caricature-semaine-2026",
      language: "fr",
      category: { slug: "caricature" },
      author: { name: "Francisco Silva" },
    },
    platforms: ["instagram-feed"],
  },
  {
    label: "explainer-analyse",
    article: {
      id: "test-analyse",
      title: "Pourquoi la crise du carburant persiste en Haïti malgré les promesses",
      subtitle: "Analyse des causes structurelles",
      excerpt:
        "Une analyse approfondie des facteurs économiques et politiques qui maintiennent Haïti dans une crise chronique du carburant.",
      body: "La crise du carburant en Haïti est le résultat de plusieurs facteurs structurels. D'abord, la dépendance totale aux importations rend le pays vulnérable aux fluctuations des prix. Ensuite, l'instabilité politique empêche la mise en place de politiques énergétiques cohérentes.",
      slug: "analyse-crise-carburant-haiti",
      language: "fr",
      category: { slug: "analyse" },
      author: { name: "Marie-Claire Dupont" },
    },
    platforms: ["instagram-feed"],
  },
];

// ── Fixture → EnginePost input ─────────────────────────────────────────────

function articleToInput(a: ArticleFixture["article"]) {
  const isFr = a.language !== "en";
  const isBreaking = Boolean(a.isBreaking);
  const categorySlug = a.category?.slug ?? "news";
  const isCaricature =
    categorySlug === "caricature" || categorySlug === "caricatures";
  const sourceLine = a.author?.name
    ? `${isFr ? "Par" : "By"} ${a.author.name}`
    : isFr
      ? "Rédaction Le Relief"
      : "Le Relief Newsroom";
  const headline = a.title.trim();
  const SITE = "https://lereliefhaiti.com";
  const articleUrl = `${SITE}/articles/${a.slug}`;

  const rawSlides = isCaricature
    ? [
        {
          slideNumber: 1,
          headline: "CARICATURE du jour avec Le Relief",
          supportLine: a.author?.name
            ? `Dessinateur : ${a.author.name}`
            : "Dessinateur : Francisco Silva",
          sourceLine,
          layoutVariant: "cover" as const,
          imageUrl: a.coverImage?.trim() || undefined,
        },
      ]
    : [
        {
          slideNumber: 1,
          headline,
          supportLine: (a.subtitle || a.excerpt || "").trim() || undefined,
          sourceLine,
          layoutVariant: "cover" as const,
          imageUrl: a.coverImage?.trim() || undefined,
        },
        {
          slideNumber: 2,
          headline: isFr ? "L'essentiel" : "Key points",
          body: ((a.excerpt ?? a.body) || "").slice(0, 260),
          sourceLine,
          layoutVariant: "detail" as const,
        },
        {
          slideNumber: 3,
          headline: isFr ? "Lire l'article" : "Read more",
          supportLine: `Lire sur ${SITE.replace(/^https?:\/\//, "")}.`,
          sourceLine,
          layoutVariant: "cta" as const,
        },
      ];

  const intake = {
    topic: headline,
    sourceSummary: ((a.excerpt ?? "") || (a.body ?? "")).slice(0, 400),
    keyFacts: a.excerpt ? [a.excerpt.slice(0, 200)] : undefined,
    category: categorySlug,
    preferredLanguage: (isFr ? "fr" : "en") as "fr" | "en",
    urgencyLevel: (isBreaking ? "breaking" : "normal") as "breaking" | "normal",
    sourceNote: sourceLine,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contentTypeHint: isCaricature ? ("caricature-card" as any) : undefined,
  };

  const caption = {
    text: [headline, "", (a.excerpt ?? "").slice(0, 320), "", `👉 ${articleUrl}`].join(
      "\n",
    ),
    shortText: isBreaking
      ? `Flash 🚨\n\n🇭🇹 ${headline}`
      : `🇭🇹 ${headline}`,
    cta: articleUrl,
    hashtags: ["#LeRelief", "#Haïti", "#Haiti"],
  };

  return {
    intake,
    rawSlides,
    caption,
    contentType: a.contentType ?? (isBreaking ? "breaking" : "news"),
  };
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const OUT_DIR = "/tmp/renderer-e2e";
  mkdirSync(OUT_DIR, { recursive: true });

  console.log("\n🧪 Le Relief — Renderer E2E Smoke Test");
  console.log("═".repeat(56));
  console.log(`Output dir: ${OUT_DIR}\n`);

  const results: {
    label: string;
    ok: boolean;
    ms: number;
    files: string[];
    error?: string;
  }[] = [];

  for (const fixture of FIXTURES) {
    const t0 = Date.now();
    const files: string[] = [];

    try {
      const { intake, rawSlides, caption, contentType } = articleToInput(
        fixture.article,
      );
      const { post, overflowWarnings } = buildPost({ intake, rawSlides, caption });

      if (overflowWarnings.length > 0) {
        console.warn(`  ⚠ overflow: ${overflowWarnings.join("; ")}`);
      }

      for (const platform of fixture.platforms) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rendered = await renderPost(post, contentType, platform as any);

        for (const slide of rendered) {
          const fname = `${fixture.label}_${platform}_slide${slide.slideNumber}.${slide.format}`;
          const fpath = join(OUT_DIR, fname);
          writeFileSync(fpath, slide.png);
          const size = statSync(fpath).size;
          files.push(
            `${fname} (${slide.widthPx}×${slide.heightPx}px, ${(size / 1024).toFixed(0)} KB)`,
          );
        }
      }

      const ms = Date.now() - t0;
      results.push({ label: fixture.label, ok: true, ms, files });
      console.log(`✅ ${fixture.label.padEnd(24)} ${ms}ms`);
      files.forEach((f) => console.log(`   📄 ${f}`));
    } catch (err) {
      const ms = Date.now() - t0;
      const error = err instanceof Error ? err.message : String(err);
      results.push({ label: fixture.label, ok: false, ms, files, error });
      console.log(`❌ ${fixture.label.padEnd(24)} ${ms}ms`);
      console.log(`   Error: ${error}`);
      if (err instanceof Error && err.stack) {
        console.log(err.stack.split("\n").slice(1, 3).join("\n"));
      }
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────

  await closeBrowserInstance();

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  const totalMs = results.reduce((s, r) => s + r.ms, 0);

  console.log("\n" + "═".repeat(56));
  console.log(`Results: ${passed}/${results.length} passed  •  total ${totalMs}ms`);

  if (failed > 0) {
    console.log("\nFailed:");
    results
      .filter((r) => !r.ok)
      .forEach((r) => console.log(`  ✗ ${r.label}: ${r.error}`));
    process.exit(1);
  } else {
    console.log(`\n✅ All tests passed! Images saved to ${OUT_DIR}`);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
