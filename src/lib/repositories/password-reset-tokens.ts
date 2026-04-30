import { FieldValue } from "firebase-admin/firestore";
import { createHash, randomBytes } from "crypto";
import { getDb } from "@/lib/firebase";

const COLLECTION = "passwordResetTokens";
const TTL_MINUTES = 60;

function collection() {
  return getDb().collection(COLLECTION);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object") {
    const r = value as Record<string, unknown>;
    if (typeof r.toDate === "function") return (r as { toDate: () => Date }).toDate();
    if (typeof r._seconds === "number") return new Date((r._seconds as number) * 1000);
    if (typeof r.seconds === "number") return new Date((r.seconds as number) * 1000);
  }
  return null;
}

/**
 * Create a new password reset token for a user.
 * Returns the plain-text token (to be included in the email link).
 */
export async function createPasswordResetToken(userId: string, email: string) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + TTL_MINUTES * 60 * 1000);

  await collection().doc(tokenHash).set({
    userId,
    email,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt,
    usedAt: null,
  });

  return { token, expiresAt };
}

/**
 * Validate a token and return the associated userId.
 * Returns null if the token is invalid, expired, or already used.
 */
export async function consumePasswordResetToken(
  token: string,
): Promise<{ ok: true; userId: string } | { ok: false; reason: "invalid" | "expired" | "used" }> {
  const tokenHash = hashToken(token);
  const db = getDb();

  return db.runTransaction(async (tx) => {
    const tokenRef = collection().doc(tokenHash);
    const snap = await tx.get(tokenRef);

    if (!snap.exists) return { ok: false, reason: "invalid" };

    const data = snap.data()!;
    if (data.usedAt) return { ok: false, reason: "used" };

    const expiresAt = toDate(data.expiresAt);
    if (!expiresAt || expiresAt < new Date()) return { ok: false, reason: "expired" };

    tx.update(tokenRef, { usedAt: FieldValue.serverTimestamp() });

    return { ok: true, userId: data.userId as string };
  });
}

/**
 * Delete all existing reset tokens for a user (e.g. after password change).
 */
export async function deleteTokensForUser(userId: string) {
  const snap = await collection().where("userId", "==", userId).get();
  const batch = getDb().batch();
  for (const doc of snap.docs) batch.delete(doc.ref);
  await batch.commit();
}
