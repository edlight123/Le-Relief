const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const app = initializeApp({ credential: applicationDefault(), projectId: "le-relief-haiti" });
const db = getFirestore(app);

async function run() {
  // Test the exact query the category page uses
  const catId = "0uTJAdccvtxWVvtnioSa"; // Actualités
  
  console.log("Testing: status=published + categoryId + orderBy(updatedAt)...");
  try {
    const q = db.collection("articles")
      .where("status", "==", "published")
      .where("categoryId", "==", catId)
      .orderBy("updatedAt", "desc");
    const snap = await q.get();
    console.log("Result:", snap.size, "articles");
  } catch (e) {
    console.log("ERROR:", e.message.slice(0, 200));
  }

  console.log("\nTesting: categoryId only + orderBy(updatedAt)...");
  try {
    const q2 = db.collection("articles")
      .where("categoryId", "==", catId)
      .orderBy("updatedAt", "desc");
    const snap2 = await q2.get();
    console.log("Result:", snap2.size, "articles");
  } catch (e) {
    console.log("ERROR:", e.message.slice(0, 200));
  }

  console.log("\nTesting: categoryId only, no orderBy...");
  try {
    const q3 = db.collection("articles")
      .where("categoryId", "==", catId);
    const snap3 = await q3.get();
    console.log("Result:", snap3.size, "articles");
  } catch (e) {
    console.log("ERROR:", e.message.slice(0, 200));
  }

  // Check a sample article's fields
  const sample = await db.collection("articles").limit(1).get();
  const data = sample.docs[0].data();
  console.log("\nSample article fields:", Object.keys(data).join(", "));
  console.log("  status:", data.status, "type:", typeof data.status);
  console.log("  categoryId:", data.categoryId);
  console.log("  updatedAt:", data.updatedAt, "type:", typeof data.updatedAt);
}
run().catch(console.error);
