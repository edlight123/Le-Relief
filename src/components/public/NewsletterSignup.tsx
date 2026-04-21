"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useLocaleContext } from "@/hooks/useLocaleContext";
import { t } from "@/lib/i18n";
import {
  getEmailDomain,
  trackNewsletterEvent,
  type NewsletterSourceMetadata,
} from "@/lib/newsletter-analytics";

const STORAGE_KEY = "lerelief_subscribed";

type NewsletterSignupStatus = "idle" | "saving" | "success" | "error" | "already";

interface NewsletterSignupProps {
  context?: string;
  sourcePath?: string;
}

function getContextualMessage(
  locale: "fr" | "en",
  context: string | undefined,
  type: "success" | "error",
  fallback: string,
) {
  if (!context) return fallback;

  const bucket = context.startsWith("footer")
    ? "footer"
    : context.startsWith("article")
      ? "article"
      : context.startsWith("home")
        ? "home"
        : "default";

  const messages = {
    fr: {
      success: {
        footer: "Merci — votre inscription à la lettre est confirmée.",
        article: "Merci, vous recevrez nos prochaines éditions.",
        home: "Parfait. Vous êtes inscrit à la lettre du Relief.",
        default: fallback,
      },
      error: {
        footer: "Inscription impossible pour le moment. Réessayez dans un instant.",
        article: "Impossible de finaliser l'inscription depuis cet article. Réessayez.",
        home: "Impossible de finaliser l'inscription pour le moment. Réessayez.",
        default: fallback,
      },
    },
    en: {
      success: {
        footer: "Thanks — your newsletter subscription is confirmed.",
        article: "Thanks, you'll receive our next editions.",
        home: "Great. You're now subscribed to Le Relief newsletter.",
        default: fallback,
      },
      error: {
        footer: "We couldn't subscribe you right now. Please try again.",
        article: "We couldn't complete signup from this article. Please try again.",
        home: "We couldn't complete your signup right now. Please try again.",
        default: fallback,
      },
    },
  } as const;

  return messages[locale][type][bucket];
}

export default function NewsletterSignup({ context, sourcePath }: NewsletterSignupProps) {
  const locale = useLocaleContext();
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<NewsletterSignupStatus>(
    () => (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) ? "already" : "idle"),
  );
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("saving");
    setMessage("");

    try {
      const source: NewsletterSourceMetadata = {
        path: sourcePath || pathname || undefined,
        locale,
        context,
        referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
      };

      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        alreadySubscribed?: boolean;
      };

      if (!res.ok) {
        const fallback = getContextualMessage(locale, context, "error", t(locale, "subscribeFailed"));
        setStatus("error");
        setMessage(data.error || fallback);
        trackNewsletterEvent("newsletter_signup_failure", {
          statusCode: res.status,
          reason: data.error || "request_failed",
          emailDomain: getEmailDomain(email),
          source,
        });
        return;
      }

      if (data.alreadySubscribed) {
        setStatus("already");
        setMessage(t(locale, "alreadySubscribed"));
        trackNewsletterEvent("newsletter_signup_success", {
          emailDomain: getEmailDomain(email),
          source,
          alreadySubscribed: true,
        });
        return;
      }

      localStorage.setItem(STORAGE_KEY, "1");
      setStatus("success");
      const fallback = getContextualMessage(locale, context, "success", t(locale, "newsletterConfirmed"));
      setMessage(data.message || fallback);
      setEmail("");
      trackNewsletterEvent("newsletter_signup_success", {
        emailDomain: getEmailDomain(email),
        source,
        alreadySubscribed: false,
      });
    } catch {
      setStatus("error");
      setMessage(getContextualMessage(locale, context, "error", t(locale, "networkError")));
      trackNewsletterEvent("newsletter_signup_failure", {
        reason: "network_error",
        emailDomain: getEmailDomain(email),
        source: {
          path: sourcePath || pathname || undefined,
          locale,
          context,
        },
      });
    }
  }

  if (status === "already") {
    return (
      <p className="font-label text-[11px] font-bold uppercase text-accent-teal">
        {message || t(locale, "alreadySubscribed")}
      </p>
    );
  }

  if (status === "success") {
    return (
      <p className="font-label text-[11px] font-bold uppercase text-accent-teal">
        {message}
      </p>
    );
  }

  return (
    <form className="newsletter-signup" onSubmit={handleSubmit}>
      <div className="relative">
        <input
          className="w-full border-2 border-foreground bg-surface px-3 py-2.5 pr-12 font-label text-sm text-foreground placeholder:text-muted transition-colors focus:border-primary focus:outline-none"
          placeholder={t(locale, "newsletterPlaceholder")}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-label={t(locale, "newsletterPlaceholder")}
          disabled={status === "saving"}
        />
        <button
          type="submit"
          disabled={status === "saving"}
          className="absolute right-0 top-0 flex h-full items-center bg-foreground px-3 text-background transition-colors hover:bg-primary disabled:opacity-50"
          aria-label={t(locale, "newsletterAria")}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>
      {message ? (
        <p className="mt-2 font-label text-[11px] font-bold uppercase text-primary">
          {message}
        </p>
      ) : null}
    </form>
  );
}
