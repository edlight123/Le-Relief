import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { existsSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir, homedir } from "os";

const SA_PATH = join(tmpdir(), "firebase-sa.json");

function ensureCredentials(): void {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return;
  if (existsSync(SA_PATH)) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = SA_PATH;
    return;
  }
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64) {
    writeFileSync(SA_PATH, Buffer.from(b64, "base64").toString("utf8"), { mode: 0o600 });
    process.env.GOOGLE_APPLICATION_CREDENTIALS = SA_PATH;
  }
}

ensureCredentials();

const app = getApps().length === 0
  ? initializeApp({ credential: applicationDefault(), projectId: "le-relief-haiti" })
  : getApps()[0]!;

const db = getFirestore(app);

async function main() {
  console.log("Testing Firestore connection...");
  const cats = await db.collection("categories").limit(10).get();
  console.log(`✅ Categories (${cats.size}):`);
  cats.forEach(d => console.log(" -", d.id, d.data().name, d.data().slug));

  const authors = await db.collection("users").limit(10).get();
  console.log(`✅ Users (${authors.size}):`);
  authors.forEach(d => console.log(" -", d.id, d.data().name, d.data().wpId));

  const articles = await db.collection("articles").limit(3).orderBy("publishedAt", "desc").get();
  console.log(`✅ Recent articles (showing 3):`);
  articles.forEach(d => console.log(" -", d.data().slug));
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
