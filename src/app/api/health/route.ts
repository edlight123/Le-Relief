import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { getDb } = await import("@/lib/firebase");
    const db = getDb();
    // Simple test: list collections
    const collections = await db.listCollections();
    return NextResponse.json({
      status: "ok",
      firebase: "connected",
      collections: collections.map((c) => c.id),
      env: {
        hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
        privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length ?? 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : String(error),
        env: {
          hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
          hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
          hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
          privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length ?? 0,
        },
      },
      { status: 500 }
    );
  }
}
