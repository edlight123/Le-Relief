import "dotenv/config";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { sanitizeExcerptText } from "../src/lib/content-format";

const projectId = process.env.FIREBASE_PROJECT_ID!;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
const privateKey = process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n").replace(/^["']|["']$/g, "");
if (!getApps().length) initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore();

const slug =
  process.argv[2] ||
  "declaration-de-patrimoine-mario-andresol-obeit-a-la-loi-mais-la-transparence-reste-un-chemin-de-croix-haitien";

async function main() {
  const snap = await db.collection("articles").where("slug", "==", slug).get();
  if (snap.empty) {
    console.log("Article not found:", slug);
    process.exit(1);
  }
  const doc = snap.docs[0];
  const data = doc.data();
  const before: string = (data.excerpt as string) || "";

  let authorName: string | null = null;
  const authorId: string | undefined = data.authorId;
  if (authorId) {
    const a = await db.collection("authors").doc(authorId).get();
    if (a.exists) authorName = (a.data()?.name as string) || null;
  }

  const cleaned = sanitizeExcerptText(before, { authorName });
  if (cleaned === before) {
    console.log("No change needed.");
    return;
  }

  console.log("BEFORE:", before);
  console.log("AFTER :", cleaned);

  await doc.ref.update({ excerpt: cleaned });
  console.log("✓ Updated", doc.id);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
