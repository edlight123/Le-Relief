import { NextRequest, NextResponse } from "next/server";
import * as subscriptionsRepo from "@/lib/repositories/subscriptions";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string };
    const email = (body.email || "").trim().toLowerCase();

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Adresse e-mail invalide" }, { status: 400 });
    }

    const subscription = await subscriptionsRepo.subscribeEmail(email);
    return NextResponse.json({
      success: true,
      subscription,
      message: "Inscription confirmée.",
    });
  } catch {
    return NextResponse.json(
      { error: "Impossible de traiter votre inscription" },
      { status: 500 }
    );
  }
}
