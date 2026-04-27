import { FieldValue } from "firebase-admin/firestore";
import { createHash, randomBytes } from "crypto";
import { getDb } from "@/lib/firebase";

const COLLECTION = "accountSetupTokens";

type TokenDoc = {
  userId?: string;
  email?: string;
  expiresAt?: unknown;
  usedAt?: unknown;
};

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
    const record = value as Record<string, unknown>;
    if (typeof record.toDate === "function") {
      return (record as { toDate: () => Date }).toDate();
    }
    if (typeof record._seconds === "number") {
      return new Date(record._seconds * 1000);
    }
    if (typeof record.seconds === "number") {
      return new Date(record.seconds * 1000);
    }
  }

  return null;
}

export async function createAccountSetupToken(data: {
  userId: string;
  email: string;
  createdById?: string | null;
  ttlMinutes?: number;
}) {
  const ttlMinutes = data.ttlMinutes ?? 24 * 60;
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  await collection().doc(tokenHash).set({
    userId: data.userId,
    email: data.email,
    createdById: data.createdById || null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    expiresAt,
    usedAt: null,
  });

  return { token, expiresAt };
}

export async function applyPasswordFromSetupToken(data: {
  token: string;
  hashedPassword: string;
}) {
  const tokenHash = hashToken(data.token);
  const db = getDb();

  return db.runTransaction(async (tx) => {
    const tokenRef = collection().doc(tokenHash);
    const tokenSnap = await tx.get(tokenRef);
    if (!tokenSnap.exists) {
      return { ok: false as const, reason: "invalid" as const };
    }

    const tokenData = (tokenSnap.data() || {}) as TokenDoc;
    const userId = tokenData.userId;
    const email = tokenData.email;
    const expiresAt = toDate(tokenData.expiresAt);
    const usedAt = toDate(tokenData.usedAt);

    if (!userId || !email || !expiresAt) {
      return { ok: false as const, reason: "invalid" as const };
    }

    if (usedAt) {
      return { ok: false as const, reason: "used" as const };
    }

    if (expiresAt.getTime() <= Date.now()) {
      return { ok: false as const, reason: "expired" as const };
    }

    const userRef = db.collection("users").doc(userId);
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) {
      return { ok: false as const, reason: "invalid" as const };
    }

    tx.update(userRef, {
      hashedPassword: data.hashedPassword,
      emailVerified: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    tx.update(tokenRef, {
      usedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { ok: true as const, email };
  });
}
