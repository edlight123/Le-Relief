import { NextRequest, NextResponse } from "next/server";
import * as subscriptionsRepo from "@/lib/repositories/subscriptions";
import { addContactToAudience, sendWelcomeEmail as resendWelcome } from "@/lib/resend";
import { sendWelcomeEmail as gmailWelcome } from "@/lib/mailer";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function sendWelcomeEmail(email: string) {
  if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) {
    await gmailWelcome(email);
  } else if (process.env.RESEND_API_KEY) {
    await resendWelcome(email);
  }
  // silently skip if neither is configured
}

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
