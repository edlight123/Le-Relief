import { FieldValue } from "firebase-admin/firestore";
import { getDb, serializeTimestamps } from "@/lib/firebase";
import type { NewsletterSourceMetadata } from "@/lib/newsletter-analytics";

const COLLECTION = "subscriptions";

function collection() {
  return getDb().collection(COLLECTION);
}

export async function getSubscriptionByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const snap = await collection().where("email", "==", normalized).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0]!;
  return serializeTimestamps({ id: doc.id, ...doc.data() } as Record<string, unknown>);
}

function sanitizeSource(source?: NewsletterSourceMetadata): NewsletterSourceMetadata | undefined {
  if (!source) return undefined;

  const cleaned: NewsletterSourceMetadata = {
    path: source.path?.trim().slice(0, 300),
    locale: source.locale === "fr" || source.locale === "en" ? source.locale : undefined,
    context: source.context?.trim().slice(0, 64),
    referrer: source.referrer?.trim().slice(0, 300),
  };

  if (!cleaned.path && !cleaned.locale && !cleaned.context && !cleaned.referrer) {
    return undefined;
  }

  return cleaned;
}

function buildSourceFields(
  source: NewsletterSourceMetadata | undefined,
  now: FirebaseFirestore.FieldValue,
) {
  if (!source) return {};

  return {
    sourcePath: source.path,
    sourceLocale: source.locale,
    sourceContext: source.context,
    sourceReferrer: source.referrer,
    sourceCapturedAt: now,
  };
}

export async function subscribeEmail(email: string, source?: NewsletterSourceMetadata) {
  const normalized = email.trim().toLowerCase();
  const existing = await getSubscriptionByEmail(normalized);
  const now = FieldValue.serverTimestamp();
  const sourceFields = buildSourceFields(sanitizeSource(source), now);

  if (existing) {
    await collection().doc(existing.id as string).update({
      active: true,
      updatedAt: now,
      ...sourceFields,
    });
    return getSubscriptionByEmail(normalized);
  }

  const ref = collection().doc();
  await ref.set({
    email: normalized,
    active: true,
    createdAt: now,
    updatedAt: now,
    ...sourceFields,
  });

  const snap = await ref.get();
  return serializeTimestamps({ id: ref.id, ...snap.data() } as Record<string, unknown>);
}
