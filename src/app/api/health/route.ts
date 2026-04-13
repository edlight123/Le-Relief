import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  const diagnostics: Record<string, unknown> = {
    nodeVersion: process.version,
    env: {
      hasBase64: !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
      hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length ?? 0,
      privateKeyStart: process.env.FIREBASE_PRIVATE_KEY?.substring(0, 40),
      hasGoogleCreds: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
    },
  };

  // Test 1: Can native crypto parse the PEM key?
  try {
    let pk = process.env.FIREBASE_PRIVATE_KEY || "";
    pk = pk.replace(/^["']|["']$/g, "");
    pk = pk.replace(/\\n/g, "\n");
    diagnostics.keyFormat = {
      startsWithBegin: pk.startsWith("-----BEGIN"),
      endsWithEnd: pk.trimEnd().endsWith("-----"),
      containsRealNewlines: pk.includes("\n"),
      lineCount: pk.split("\n").length,
    };
    const keyObj = crypto.createPrivateKey(pk);
    diagnostics.cryptoTest = {
      status: "ok",
      keyType: keyObj.type,
      asymmetricKeyType: keyObj.asymmetricKeyType,
    };
  } catch (err) {
    diagnostics.cryptoTest = {
      status: "error",
      message: err instanceof Error ? err.message : String(err),
    };
  }

  // Test 2: Can firebase-admin initialize via ADC?
  try {
    const { getDb } = await import("@/lib/firebase");
    const db = getDb();
    diagnostics.adcPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ?? "not set";
    const collections = await db.listCollections();
    diagnostics.firebase = {
      status: "ok",
      collections: collections.map((c) => c.id),
    };
  } catch (error) {
    diagnostics.firebase = {
      status: "error",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.split("\n").slice(0, 5) : undefined,
    };
  }

  const ok = (diagnostics.firebase as Record<string, unknown>)?.status === "ok";
  return NextResponse.json(diagnostics, { status: ok ? 200 : 500 });
}
