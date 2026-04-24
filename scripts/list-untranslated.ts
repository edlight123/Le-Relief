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

async function main() {
  const all = await db.collection("articles").get();
  const enBySource = new Set<string>();
  for (const d of all.docs) {
    const data = d.data() as Record<string, unknown>;
    if (data.language === "en" && data.sourceArticleId) enBySource.add(data.sourceArticleId as string);
  }
  const missing: Array<{ id: string; slug: string; bodyLen: number; titleLen: number; status: string }> = [];
  for (const d of all.docs) {
    const data = d.data() as Record<string, unknown>;
    if ((data.language || "fr") !== "fr") continue;
    if (data.status !== "published") continue;
    if (enBySource.has(d.id)) continue;
    missing.push({
      id: d.id,
      slug: (data.slug as string) || "",
      bodyLen: ((data.body as string) || "").trim().length,
      titleLen: ((data.title as string) || "").trim().length,
      status: data.status as string,
    });
  }
  console.log(`Missing: ${missing.length}`);
  for (const m of missing) console.log(`  bodyLen=${m.bodyLen.toString().padStart(5)} titleLen=${m.titleLen.toString().padStart(3)} ${m.slug}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
