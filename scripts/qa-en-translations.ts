import "dotenv/config";
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID!;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
const privateKey = process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n").replace(/^["']|["']$/g, "");
if (!getApps().length) initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore();

interface Sample {
  id: string;
  slug: string;
  title: string;
  bodyLen: number;
  titleLen: number;
  excerptLen: number;
  status: string;
  translationStatus: string;
  hasSubtitle: boolean;
  hasSeoTitle: boolean;
  hasMetaDescription: boolean;
  sourceArticleId: string | null;
  // QA flags
  containsFrenchWords: boolean;
  hasSuspiciousChars: boolean;
  emptyKeyFields: string[];
}

// Quick heuristic: detect words that are clearly still French (common stop-words / function-words)
const FRENCH_TELLS = [
  /\b(le|la|les|une|des|nous|vous|qu['']?est|c['']?est|d['']?un|d['']?une|aujourd['']?hui|n['']?est|n['']?a)\b/i,
  /\b(pourquoi|parce|toujours|jamais|encore|déjà|aussi|alors|donc|maintenant)\b/i,
  /\b(haïtien(ne|s)?|étranger|étrangers|étrangère)\b/i, // accented FR-only forms
  /\b(et|ou|mais|car|ni|or)\s+(le|la|les|un|une|des)\b/i,
];

function looksFrench(text: string): boolean {
  if (!text) return false;
  // strip HTML
  const stripped = text.replace(/<[^>]+>/g, " ");
  // require 2+ matches to reduce false positives (e.g. "or" appearing as English)
  let hits = 0;
  for (const r of FRENCH_TELLS) {
    if (r.test(stripped)) hits++;
    if (hits >= 2) return true;
  }
  return false;
}

function hasSuspiciousChars(text: string): boolean {
  if (!text) return false;
  // Unrendered placeholders, double-encoded entities, etc.
  return /\{\{|\}\}|undefined|null,|\\n\\n\\n|&amp;amp;/.test(text);
}

async function main() {
  const all = await db.collection("articles").where("language", "==", "en").get();
  console.log(`Total EN articles: ${all.size}`);

  const samples: Sample[] = [];
  let countSuspicious = 0;
  let countFrench = 0;
  let countEmptyKey = 0;

  for (const doc of all.docs) {
    const data = doc.data() as Record<string, unknown>;
    const title = ((data.title as string) || "").trim();
    const body = ((data.body as string) || "").trim();
    const excerpt = ((data.excerpt as string) || "").trim();
    const subtitle = ((data.subtitle as string) || "").trim();
    const seoTitle = ((data.seoTitle as string) || "").trim();
    const metaDescription = ((data.metaDescription as string) || "").trim();

    const emptyKeyFields: string[] = [];
    if (!title) emptyKeyFields.push("title");
    if (!body || body.length < 50) emptyKeyFields.push("body");
    if (!excerpt) emptyKeyFields.push("excerpt");

    const containsFrenchWords =
      looksFrench(title) || looksFrench(excerpt) || looksFrench(body.slice(0, 4000));
    const suspicious =
      hasSuspiciousChars(title) || hasSuspiciousChars(body) || hasSuspiciousChars(excerpt);

    if (containsFrenchWords) countFrench++;
    if (suspicious) countSuspicious++;
    if (emptyKeyFields.length) countEmptyKey++;

    samples.push({
      id: doc.id,
      slug: (data.slug as string) || "",
      title: title.slice(0, 80),
      bodyLen: body.length,
      titleLen: title.length,
      excerptLen: excerpt.length,
      status: (data.status as string) || "",
      translationStatus: (data.translationStatus as string) || "",
      hasSubtitle: subtitle.length > 0,
      hasSeoTitle: seoTitle.length > 0,
      hasMetaDescription: metaDescription.length > 0,
      sourceArticleId: (data.sourceArticleId as string) || null,
      containsFrenchWords,
      hasSuspiciousChars: suspicious,
      emptyKeyFields,
    });
  }

  // Status breakdown
  const statusCounts: Record<string, number> = {};
  const tStatusCounts: Record<string, number> = {};
  for (const s of samples) {
    statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
    tStatusCounts[s.translationStatus] = (tStatusCounts[s.translationStatus] || 0) + 1;
  }

  console.log("\n=== Status breakdown ===");
  console.log("status:", statusCounts);
  console.log("translationStatus:", tStatusCounts);

  console.log("\n=== Field coverage ===");
  console.log("withSubtitle:", samples.filter((s) => s.hasSubtitle).length);
  console.log("withSeoTitle:", samples.filter((s) => s.hasSeoTitle).length);
  console.log("withMetaDescription:", samples.filter((s) => s.hasMetaDescription).length);
  console.log("avgBodyLen:", Math.round(samples.reduce((a, s) => a + s.bodyLen, 0) / samples.length));

  console.log("\n=== QA flags ===");
  console.log(`Suspicious chars/placeholders: ${countSuspicious}`);
  console.log(`Looks like French residue:    ${countFrench}`);
  console.log(`Missing key fields:           ${countEmptyKey}`);
  console.log(`No source article id:          ${samples.filter((s) => !s.sourceArticleId).length}`);

  if (countFrench) {
    console.log("\n=== First 10 with French residue ===");
    for (const s of samples.filter((x) => x.containsFrenchWords).slice(0, 10)) {
      console.log(`  ${s.slug}\n    title: ${s.title}`);
    }
  }
  if (countEmptyKey) {
    console.log("\n=== First 10 with missing fields ===");
    for (const s of samples.filter((x) => x.emptyKeyFields.length).slice(0, 10)) {
      console.log(`  ${s.slug}  missing=[${s.emptyKeyFields.join(",")}] bodyLen=${s.bodyLen}`);
    }
  }
  if (countSuspicious) {
    console.log("\n=== First 10 suspicious ===");
    for (const s of samples.filter((x) => x.hasSuspiciousChars).slice(0, 10)) {
      console.log(`  ${s.slug}`);
    }
  }

  // Random sample for spot-check
  console.log("\n=== Random spot-check sample (5) ===");
  const shuffled = [...samples].sort(() => Math.random() - 0.5).slice(0, 5);
  for (const s of shuffled) {
    const docSnap = await db.collection("articles").doc(s.id).get();
    const d = docSnap.data() || {};
    console.log(`\n--- ${s.slug} ---`);
    console.log(`title:    ${(d.title as string || "").slice(0, 120)}`);
    console.log(`subtitle: ${(d.subtitle as string || "").slice(0, 120)}`);
    console.log(`excerpt:  ${(d.excerpt as string || "").slice(0, 200)}`);
    const bodyTxt = ((d.body as string) || "").replace(/<[^>]+>/g, " ").slice(0, 300);
    console.log(`body[0..300]: ${bodyTxt}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
