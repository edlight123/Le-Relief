import { NextResponse } from "next/server";

/**
 * Self-registration is disabled.
 * All accounts are pre-created by a superadmin.
 */
export async function POST() {
  return NextResponse.json(
    { error: "L'inscription publique est désactivée. Contactez un administrateur." },
    { status: 403 }
  );
}
