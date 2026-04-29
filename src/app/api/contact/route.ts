import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const { name, email, message } = body;

  if (
    !name || typeof name !== "string" ||
    !email || typeof email !== "string" ||
    !message || typeof message !== "string"
  ) {
    return NextResponse.json(
      { error: "Missing required fields: name, email, message" },
      { status: 400 },
    );
  }

  await getDb().collection("contact_submissions").add({
    name: name.trim().slice(0, 200),
    email: email.trim().slice(0, 320),
    message: message.trim().slice(0, 5000),
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ success: true, message: "Message reçu" });
}
