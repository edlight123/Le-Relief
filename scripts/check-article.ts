import "dotenv/config";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID!;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
let privateKey = process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n").replace(/^["']|["']$/g, "");

if (!getApps().length) initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore();

const slug = process.argv[2] || "ceremonie-dadieu-a-la-chancellerie-haiti-honore-le-representant-special-de-loea";
async function main() {
  const snap = await db.collection("articles").where("slug", "==", slug).get();
  if (snap.empty) { console.log("not found"); process.exit(0); }
  const d = snap.docs[0].data();
  console.log("body length:", d.body?.length);
  console.log("---BODY START---");
  console.log(d.body?.substring(0, 4000));
}
main();
