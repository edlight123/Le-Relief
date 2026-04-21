import { NextRequest, NextResponse } from "next/server";
import * as subscriptionsRepo from "@/lib/repositories/subscriptions";
import { addContactToAudience, sendWelcomeEmail as resendWelcome } from "@/lib/resend";
import { sendWelcomeEmail as gmailWelcome } from "@/lib/mailer";
import {
  getEmailDomain,
  trackNewsletterEvent,
  type NewsletterSourceMetadata,
} from "@/lib/newsletter-analytics";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RequestBody = {
  email?: string;
  source?: NewsletterSourceMetadata;
};

function sanitizeText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
}

function sanitizePath(value: unknown): string | undefined {
  const raw = sanitizeText(value, 300);
  if (!raw) return undefined;
  if (raw.startsWith("/")) return raw;

  try {
    const parsed = new URL(raw);
    return `${parsed.origin}${parsed.pathname}`.slice(0, 300);
  } catch {
    return undefined;
  }
}

function sanitizeLocale(value: unknown): "fr" | "en" | undefined {
  if (value === "fr" || value === "en") return value;
  return undefined;
}

function sanitizeContext(value: unknown): string | undefined {
  const context = sanitizeText(value, 64);
  if (!context) return undefined;
  return /^[a-z0-9:_-]+$/i.test(context) ? context : undefined;
}

function sanitizeSourceMetadata(source: unknown): NewsletterSourceMetadata | undefined {
  if (!source || typeof source !== "object") return undefined;

  const value = source as Record<string, unknown>;
  const sanitized: NewsletterSourceMetadata = {
    path: sanitizePath(value.path),
    locale: sanitizeLocale(value.locale),
    context: sanitizeContext(value.context),
    referrer: sanitizePath(value.referrer),
  };

  if (!sanitized.path && !sanitized.locale && !sanitized.context && !sanitized.referrer) {
    return undefined;
  }

  return sanitized;
}

function getLocalizedMessages(locale: "fr" | "en") {
  if (locale === "en") {
    return {
      invalidEmail: "Invalid email address",
      confirmed: "Subscription confirmed.",
      confirmedWithEmail: "Subscription confirmed. Please check your inbox.",
      failed: "Unable to process your subscription",
    };
  }

  return {
    invalidEmail: "Adresse e-mail invalide",
    confirmed: "Inscription confirmée.",
    confirmedWithEmail: "Inscription confirmée. Vérifiez votre boîte de réception.",
    failed: "Impossible de traiter votre inscription",
  };
}

function emailConfigured() {
  return (
    (!!process.env.EMAIL_USER && !!process.env.EMAIL_APP_PASSWORD) ||
    !!process.env.RESEND_API_KEY
  );
}

async function sendWelcomeEmail(email: string) {
  if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) {
    await gmailWelcome(email);
  } else if (process.env.RESEND_API_KEY) {
    await resendWelcome(email);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const email = (body.email || "").trim().toLowerCase();
    const source = sanitizeSourceMetadata(body.source);
    const locale = source?.locale ?? "fr";
    const messages = getLocalizedMessages(locale);

    if (!EMAIL_RE.test(email)) {
      trackNewsletterEvent("newsletter_signup_failure", {
        statusCode: 400,
        reason: "invalid_email",
        emailDomain: getEmailDomain(email),
        source,
      });
      return NextResponse.json({ error: messages.invalidEmail }, { status: 400 });
    }

    const existing = await subscriptionsRepo.getSubscriptionByEmail(email);
    const subscription = await subscriptionsRepo.subscribeEmail(email, source);

    const willSendEmail = !existing && emailConfigured();

    if (!existing) {
      Promise.all([
        addContactToAudience(email).catch(() => null),
        sendWelcomeEmail(email).catch(() => null),
      ]);
    }

    trackNewsletterEvent("newsletter_signup_success", {
      emailDomain: getEmailDomain(email),
      source,
      alreadySubscribed: !!existing,
    });

    return NextResponse.json({
      success: true,
      subscription,
      emailSent: willSendEmail,
      alreadySubscribed: !!existing,
      message: willSendEmail
        ? messages.confirmedWithEmail
        : messages.confirmed,
    });
  } catch {
    trackNewsletterEvent("newsletter_signup_failure", {
      statusCode: 500,
      reason: "server_error",
    });
    return NextResponse.json(
      { error: "Impossible de traiter votre inscription" },
      { status: 500 },
    );
  }
}
