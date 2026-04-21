export type NewsletterEventName = "newsletter_signup_success" | "newsletter_signup_failure";

export interface NewsletterSourceMetadata {
  path?: string;
  locale?: "fr" | "en";
  context?: string;
  referrer?: string;
}

export interface NewsletterEventPayload {
  statusCode?: number;
  reason?: string;
  emailDomain?: string;
  source?: NewsletterSourceMetadata;
  alreadySubscribed?: boolean;
}

export function getEmailDomain(email: string): string | undefined {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) return undefined;
  const domain = normalized.split("@")[1]?.trim();
  return domain || undefined;
}

export function trackNewsletterEvent(name: NewsletterEventName, payload: NewsletterEventPayload) {
  const details = {
    ...payload,
    timestamp: new Date().toISOString(),
  };

  if (name === "newsletter_signup_failure") {
    console.warn("[newsletter]", name, details);
    return;
  }

  console.info("[newsletter]", name, details);
}
