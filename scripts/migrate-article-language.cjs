/**
 * Migration: set language="fr" on all articles missing the language field.
 * Run once: node scripts/migrate-article-language.cjs
 */
const dotenv = require("dotenv");
dotenv.config({ path: require("path").resolve(__dirname, "../.env") });

const admin = require("../node_modules/firebase-admin");

const key = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: key,
    }),
  });
}

const db = admin.firestore();

async function run() {
  const snap = await db.collection("articles").get();
  const batch = db.batch();
  let count = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.language === undefined || data.language === null || data.language === "") {
      batch.update(doc.ref, { language: "fr" });
      count++;
      console.log(`  → ${doc.id.slice(0, 8)}… "${String(data.title || "").slice(0, 60)}"`);
    }
  }

  if (count === 0) {
    console.log("Nothing to migrate — all articles already have a language field.");
    process.exit(0);
  }

  await batch.commit();
  console.log(`\nDone. Updated ${count} article(s) with language="fr".`);
  process.exit(0);
}

run().catch((e) => {
  console.error("Migration failed:", e.message);
  process.exit(1);
});
