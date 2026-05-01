import "dotenv/config";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
const projectId = process.env.FIREBASE_PROJECT_ID!;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
const privateKey = (process.env.FIREBASE_PRIVATE_KEY!).replace(/\\n/g, "\n").replace(/^["']|["']$/g, "");
if (!getApps().length) initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore();

async function main() {
  const frSlug = "les-emirats-arabes-unis-annoncent-leur-retrait-surprise-de-lopep-a-partir-du-1er-mai-2026";
  const frSnap = await db.collection("articles").where("slug", "==", frSlug).limit(2).get();
  console.log("FR docs:", frSnap.size);
  for (const doc of frSnap.docs) {
    const d = doc.data();
    console.log("  id:", doc.id, "lang:", d.language, "status:", d.status, "alternateSlug:", d.alternateLanguageSlug ?? "NONE");
    const enSnap = await db.collection("articles").where("sourceArticleId", "==", doc.id).limit(5).get();
    console.log("  EN translations:", enSnap.size);
    for (const e of enSnap.docs) {
      const ed = e.data();
      console.log("  EN:", e.id, "slug:", ed.slug, "status:", ed.status, "alternateSlug:", ed.alternateLanguageSlug ?? "NONE");
    }
  }

  // Also check the EN article directly by its slug
  const enSlug = "united-arab-emirates-announce-surprise-withdrawal-from-opec-starting-may-1-2026";
  const enSnap2 = await db.collection("articles").where("slug", "==", enSlug).limit(2).get();
  console.log("\nEN by slug:", enSnap2.size);
  for (const doc of enSnap2.docs) {
    const d = doc.data();
    console.log("  id:", doc.id, "lang:", d.language, "status:", d.status, "alternateSlug:", d.alternateLanguageSlug ?? "NONE", "sourceArticleId:", d.sourceArticleId ?? "NONE");
  }
}
main().catch(console.error);
