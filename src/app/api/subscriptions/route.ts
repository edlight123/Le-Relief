import { NextRequest, NextResponse } from "next/server";
import * as subscriptionsRepo from "@/lib/repositories/subscriptions";
import { addContactToAudience, sendWelcomeEmail } from "@/lib/resend";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string };
    const email = (body.email || "").trim().toLowerCase();

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Adresse e-mail invalide" }, { status: 400 });
    }

    const existing = await subscriptionsRepo.getSubscriptionByEmail(email);
    const subscription = await subscriptionsRepo.subscribeEmail(email);

    if (!existing) {
      // Fire-and-forget — don't let Resend errors block the response
      Promise.all([
        addContactToAudience(email).catch(() => null),
        sendWelcomeEmail(email).catch(() => null),
      ]);
    }

    return NextResponse.json({
      success: true,
      subscription,
      message: "Inscription confirmée. Vérifiez votre boîte de réception.",
    });
  } catch {
    return NextResponse.json(
      { error: "Impossible de traiter votre inscription" },
      { status: 500 },
    );
  }
}
