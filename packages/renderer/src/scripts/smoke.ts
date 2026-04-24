/**
 * Smoke script — renders a single demo post for every PlatformId.
 *
 * Usage:
 *   pnpm --filter @le-relief/renderer smoke
 *
 * Requires a Chromium binary available either at PLAYWRIGHT_CHROMIUM_PATH or
 * on the system path (apt install chromium).
 */

import { mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  listPlatformIds,
  renderForAllPlatforms,
  setBrand,
} from "../index.js";
import type { ContentIntakeInput, PostCaption, SlideContent } from "../engine/types/post.js";

// Configure brand (defaults are already Le Relief, but demonstrate the API)
setBrand({
  name: "Le Relief",
  wordmark: { left: "LE", right: "RELIEF" },
  socials: {
    instagram: "@lereliefhaiti",
    x: "@lereliefhaiti",
    threads: "@lereliefhaiti",
    whatsappNumber: "+50900000000",
  },
  website: "lereliefhaiti.com",
});

const intake: ContentIntakeInput = {
  topic: "Le Relief lance une nouvelle rubrique dédiée à la diaspora haïtienne",
  sourceSummary:
    "Dès cette semaine, Le Relief publie chaque vendredi un reportage long consacré à la diaspora haïtienne — son économie, ses artistes, ses luttes et sa façon de rester connectée au pays.",
  category: "news",
  preferredLanguage: "fr",
  urgencyLevel: "normal",
  sourceNote: "Rédaction Le Relief",
};

const rawSlides: SlideContent[] = [
  {
    slideNumber: 1,
    headline: "Une nouvelle rubrique dédiée à la diaspora",
    supportLine:
      "Chaque vendredi, un long format sur les Haïtiens de l'étranger.",
    sourceLine: "Rédaction Le Relief",
    layoutVariant: "cover",
  },
  {
    slideNumber: 2,
    headline: "Économie, culture, engagement",
    body: "• Envois d'argent qui financent l'école et la santé\n• Artistes qui tournent entre Port-au-Prince, Miami et Montréal\n• Voix qui comptent dans le débat public haïtien",
    sourceLine: "Rédaction Le Relief",
    layoutVariant: "detail",
  },
  {
    slideNumber: 3,
    headline: "Rendez-vous tous les vendredis",
    supportLine: "Sur lereliefhaiti.com et tous nos réseaux.",
    sourceLine: "Rédaction Le Relief",
    layoutVariant: "cta",
  },
];

const caption: PostCaption = {
  text:
    "Le Relief ouvre une nouvelle rubrique hebdomadaire entièrement consacrée à la diaspora haïtienne. Longs formats, portraits, analyses — tous les vendredis.",
  cta: "Rendez-vous sur lereliefhaiti.com.",
  hashtags: ["#LeRelief", "#Haïti", "#Diaspora"],
};

const outputDir = join(process.cwd(), "out");
mkdirSync(outputDir, { recursive: true });

const result = await renderForAllPlatforms(intake, {
  platforms: listPlatformIds(),
  outputDir,
  rawSlides,
  caption,
  contentType: "news",
  forceExport: true,
});

console.log("── Smoke result ──────────────────────────────────────");
for (const [platform, res] of Object.entries(result.exports)) {
  if (!res) continue;
  console.log(
    `  ${platform.padEnd(24)} → ${res.success ? "✓" : "✗"} ` +
      `${res.slideFiles.length} slide(s) ` +
      (res.errors.length ? `errors=${res.errors.join("; ")}` : ""),
  );
}
