const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const app = initializeApp({ credential: applicationDefault(), projectId: "le-relief-haiti" });
const db = getFirestore(app);

async function run() {
  const toDelete = [
    "UAB3iPIAuLHxxfGSgqGO",
    "OS2QBDudWu52Hc99KHTb",
    "RAAbgswV7hrO8naPrrNI",
    "d4nRlM91QnUN0C1Ha0Xn",
    "jAZqpLE18Rg5hHUixIPm",
    "uwlFo3MPJlVqLr8OhOyZ",
  ];
  const actuId = "0uTJAdccvtxWVvtnioSa";

  for (const catId of toDelete) {
    const catSnap = await db.collection("categories").doc(catId).get();
    console.log("Deleting:", catSnap.data() && catSnap.data().name);
    const articles = await db.collection("articles").where("categoryId", "==", catId).get();
    if (!articles.empty) {
      const batch = db.batch();
      articles.docs.forEach(function(d) { batch.update(d.ref, { categoryId: actuId }); });
      await batch.commit();
      console.log("  Reassigned", articles.size, "articles");
    }
    await db.collection("categories").doc(catId).delete();
  }

  await db.collection("categories").doc("v69mz0RrxNeh1YVzpFEe").update({ slug: "sport" });
  console.log("Fixed Sport slug");
  console.log("Done!");
}

run().catch(console.error);
