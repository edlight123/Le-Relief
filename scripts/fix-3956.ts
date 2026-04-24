import "dotenv/config";
import { config } from "dotenv"; config({ path: ".env.local" });
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { translateFrenchArticleToEnglish } from "../src/lib/ai/translation";
import { generateSlug } from "../src/lib/slug";

const projectId = process.env.FIREBASE_PROJECT_ID!;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
const privateKey = process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n").replace(/^["']|["']$/g, "");
if (!getApps().length) initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore();

(async () => {
  const enRef = db.collection("articles").doc("gzLRKhLi6K9DoHFecSE1");
  const enSnap = await enRef.get();
  if (!enSnap.exists) { console.log("EN doc not found"); return; }
  const en = enSnap.data()!;
  if (en.status === "published") { console.log("Already published"); return; }
  const frRef = db.collection("articles").doc(en.sourceArticleId as string);
  const frSnap = await frRef.get();
  const fr = frSnap.data()!;
  console.log("FR title:", String(fr.title).slice(0, 100));
  console.log("FR body length:", String(fr.body || "").length);
  const t = await translateFrenchArticleToEnglish({
    title: fr.title as string,
    subtitle: (fr.subtitle as string) || null,
    excerpt: (fr.excerpt as string) || null,
    body: (fr.body as string) || (fr.title as string),
    categoryName: "",
    contentType: "actualite",
    authorName: "",
    sourceSlug: fr.slug as string,
  });
  console.log("TitleEn:", t.titleEn);
  const newSlug = generateSlug(t.titleEn);
  const batch = db.batch();
  batch.update(enRef, {
    title: t.titleEn,
    subtitle: t.subtitleEn || "",
    excerpt: t.excerptEn || "",
    body: t.bodyEn || en.body,
    seoTitle: t.seoTitleEn || t.titleEn,
    metaDescription: t.seoDescriptionEn || t.excerptEn || "",
    slug: newSlug,
    status: "published",
    translationStatus: "published",
    publishedAt: fr.publishedAt || FieldValue.serverTimestamp(),
    alternateLanguageSlug: fr.slug,
    updatedAt: FieldValue.serverTimestamp(),
  });
  batch.update(frRef, {
    alternateLanguageSlug: newSlug,
    updatedAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();
  console.log("✓ published", newSlug);
})();
