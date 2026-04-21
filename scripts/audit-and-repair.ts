import "dotenv/config";
import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { writeFileSync } from "node:fs";

const shouldFix = process.argv.includes("--fix");

if (getApps().length === 0) {
  initializeApp({
    credential: applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID ?? undefined,
  });
}

const db = getFirestore();

type InvalidSourceRecord = {
  id: string;
  title?: string;
  sourceArticleId?: string | null;
  reason: string;
};

async function validateSource(sourceArticleId: string | null | undefined): Promise<{ valid: boolean; reason?: string }> {
  if (!sourceArticleId) {
    return { valid: false, reason: "missing_sourceArticleId" };
  }

  const sourceRef = await db.collection("articles").doc(sourceArticleId).get();
  if (!sourceRef.exists) {
    return { valid: false, reason: "source_not_found" };
  }

  const source = sourceRef.data() as {
    language?: string;
    isCanonicalSource?: boolean;
    sourceArticleId?: string | null;
    status?: string;
  };

  if (source.language !== "fr") {
    return { valid: false, reason: "source_not_french" };
  }
  if (source.isCanonicalSource !== true) {
    return { valid: false, reason: "source_not_canonical" };
  }
  if (source.sourceArticleId) {
    return { valid: false, reason: "source_is_translation_chain" };
  }
  if (source.status !== "published") {
    return { valid: false, reason: "source_not_published" };
  }

  return { valid: true };
}

async function main() {
  const [enSnap, frSnap] = await Promise.all([
    db.collection("articles").where("language", "==", "en").get(),
    db.collection("articles").where("language", "==", "fr").get(),
  ]);

  const orphaned: string[] = [];
  const invalidSources: InvalidSourceRecord[] = [];

  for (const doc of enSnap.docs) {
    const data = doc.data() as { title?: string; sourceArticleId?: string | null };

    if (!data.sourceArticleId) {
      orphaned.push(doc.id);
      continue;
    }

    const validation = await validateSource(data.sourceArticleId);
    if (!validation.valid) {
      invalidSources.push({
        id: doc.id,
        title: data.title,
        sourceArticleId: data.sourceArticleId,
        reason: validation.reason || "unknown",
      });
    }
  }

  const enSourceIds = new Set(
    enSnap.docs
      .map((doc) => (doc.data() as { sourceArticleId?: string | null }).sourceArticleId)
      .filter((id): id is string => Boolean(id)),
  );

  const frNeedsAllowTranslationFix: string[] = [];
  for (const doc of frSnap.docs) {
    const data = doc.data() as { allowTranslation?: boolean };
    if (enSourceIds.has(doc.id) && data.allowTranslation !== true) {
      frNeedsAllowTranslationFix.push(doc.id);
    }
  }

  const repaired: string[] = [];
  if (shouldFix && frNeedsAllowTranslationFix.length > 0) {
    for (const id of frNeedsAllowTranslationFix) {
      await db.collection("articles").doc(id).update({
        allowTranslation: true,
        updatedAt: FieldValue.serverTimestamp(),
      });
      repaired.push(id);
    }
  }

  const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const reportPath = `migration-report-${dateStamp}.json`;

  const report = {
    timestamp: new Date().toISOString(),
    fixMode: shouldFix,
    summary: {
      totalEnArticles: enSnap.size,
      orphanedCount: orphaned.length,
      invalidSourcesCount: invalidSources.length,
      frAllowTranslationFixCandidates: frNeedsAllowTranslationFix.length,
      repairedCount: repaired.length,
    },
    orphanedEnArticles: orphaned,
    invalidSources,
    frAllowTranslationFixCandidates: frNeedsAllowTranslationFix,
    repaired,
  };

  writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify(report, null, 2));
  console.log(`\nReport saved: ${reportPath}`);
}

main().catch((error) => {
  console.error("Audit failed", error);
  process.exit(1);
});
