import "dotenv/config";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID!;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
const privateKey = process.env.FIREBASE_PRIVATE_KEY!
  .replace(/\\n/g, "\n")
  .replace(/^["']|["']$/g, "");

if (!getApps().length) initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore();

async function main() {
  const all = await db.collection("articles").get();
  let totalFr = 0;
  let publishedFr = 0;
  let publishedFrAllowed = 0;
  let alreadyHasEn = 0;
  let totalEn = 0;
  let totalBodyChars = 0;
  let totalBodyCharsAllowed = 0;
  const enBySource = new Map<string, true>();

  for (const d of all.docs) {
    const data = d.data() as Record<string, unknown>;
    const lang = (data.language as string) || "fr";
    if (lang === "en") {
      totalEn++;
      const src = data.sourceArticleId as string | undefined;
      if (src) enBySource.set(src, true);
    } else {
      totalFr++;
      const status = (data.status as string) || "";
      const allow = data.allowTranslation === true;
      const body = (data.body as string) || "";
      if (status === "published") {
        publishedFr++;
        totalBodyChars += body.length;
        if (allow) {
          publishedFrAllowed++;
          totalBodyCharsAllowed += body.length;
        }
      }
    }
  }

  // Count FR published articles already having an EN translation
  for (const d of all.docs) {
    const data = d.data() as Record<string, unknown>;
    if ((data.language || "fr") === "fr" && data.status === "published" && enBySource.has(d.id)) {
      alreadyHasEn++;
    }
  }

  const remaining = publishedFr - alreadyHasEn;
  console.log(JSON.stringify({
    totalArticles: all.size,
    totalFr,
    publishedFr,
    publishedFrAllowTranslation: publishedFrAllowed,
    totalEn,
    publishedFrAlreadyTranslated: alreadyHasEn,
    publishedFrRemainingToTranslate: remaining,
    avgBodyCharsPublishedFr: publishedFr ? Math.round(totalBodyChars / publishedFr) : 0,
    totalBodyCharsAllPublishedFr: totalBodyChars,
    totalBodyCharsAllowTranslation: totalBodyCharsAllowed,
  }, null, 2));
}
main().catch((e) => { console.error(e); process.exit(1); });
