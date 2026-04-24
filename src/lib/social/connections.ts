/**
 * Connection storage abstraction — Firestore `social_connections/{platform}`.
 *
 * Tokens are stored AES-256-GCM-encrypted with a key derived from
 * `SOCIAL_TOKENS_KEY` env var (32-byte hex). The encrypted blob is opaque
 * to the rest of the app; only `decryptToken` (called from publish
 * adapters) ever reads it.
 *
 * V1 only ships READ access (`getConnection`) — the OAuth connect UI that
 * writes to this collection is a separate piece of work scheduled when
 * Meta/X/LinkedIn developer accounts are ready.
 */

import crypto from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getDb, serializeTimestamps } from "@/lib/firebase";
import type { ConnectionPlatform, SocialConnection } from "@/types/social";

const COLLECTION = "social_connections";

export async function getConnection(
  platform: ConnectionPlatform,
): Promise<SocialConnection | null> {
  const doc = await getDb().collection(COLLECTION).doc(platform).get();
  if (!doc.exists) return null;
  return serializeTimestamps({
    platform,
    ...doc.data(),
  } as unknown as Record<string, unknown>) as unknown as SocialConnection;
}

export async function listConnections(): Promise<SocialConnection[]> {
  const snap = await getDb().collection(COLLECTION).get();
  return snap.docs.map(
    (d) =>
      serializeTimestamps({
        platform: d.id,
        ...d.data(),
      } as unknown as Record<string, unknown>) as unknown as SocialConnection,
  );
}

export interface SetConnectionInput {
  platform: ConnectionPlatform;
  token: string;
  refreshToken?: string | null;
  expiresAt?: string | null;
  accountId?: string | null;
  accountName?: string | null;
  scopes?: string[];
  metadata?: Record<string, string> | null;
}

/**
 * Persist (or replace) a connection. The token is encrypted before
 * leaving this function — the plaintext is never stored.
 */
export async function setConnection(input: SetConnectionInput): Promise<void> {
  const payload: Record<string, unknown> = { token: input.token };
  if (input.refreshToken) payload.refreshToken = input.refreshToken;
  await getDb()
    .collection(COLLECTION)
    .doc(input.platform)
    .set(
      {
        status: "connected",
        encryptedToken: encryptToken(JSON.stringify(payload)),
        expiresAt: input.expiresAt ?? null,
        accountId: input.accountId ?? null,
        accountName: input.accountName ?? null,
        scopes: input.scopes ?? [],
        metadata: input.metadata ?? null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}

export async function disconnect(platform: ConnectionPlatform): Promise<void> {
  await getDb()
    .collection(COLLECTION)
    .doc(platform)
    .set(
      {
        status: "disconnected",
        encryptedToken: FieldValue.delete(),
        expiresAt: null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}

/**
 * Read + decrypt the token JSON for a platform. Returns null if no
 * active connection exists. ONLY callable from publish adapters —
 * never expose the result over the network.
 */
export async function getDecryptedToken(
  platform: ConnectionPlatform,
): Promise<{ token: string; refreshToken?: string } | null> {
  const conn = await getConnection(platform);
  if (!conn || conn.status !== "connected" || !conn.encryptedToken) return null;
  try {
    return JSON.parse(decryptToken(conn.encryptedToken)) as {
      token: string;
      refreshToken?: string;
    };
  } catch {
    return null;
  }
}

// ── Crypto helpers (used by future OAuth callback + by publish adapters) ────

const KEY_LEN = 32;
const IV_LEN = 12;

function getKey(): Buffer {
  const hex = process.env.SOCIAL_TOKENS_KEY;
  if (!hex) throw new Error("SOCIAL_TOKENS_KEY env var is required to read social tokens");
  const buf = Buffer.from(hex, "hex");
  if (buf.length !== KEY_LEN) {
    throw new Error(`SOCIAL_TOKENS_KEY must be ${KEY_LEN * 2} hex chars (got ${buf.length * 2})`);
  }
  return buf;
}

export function encryptToken(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptToken(blob: string): string {
  const buf = Buffer.from(blob, "base64");
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + 16);
  const data = buf.subarray(IV_LEN + 16);
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
