"use client";

import { useState } from "react";
import { useLocaleContext } from "@/hooks/useLocaleContext";
import { t } from "@/lib/i18n";

const STORAGE_KEY = "lerelief_subscribed";

export default function NewsletterSignup() {
  const locale = useLocaleContext();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error" | "already">(
    () => (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) ? "already" : "idle"),
  );
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("saving");
    setMessage("");

    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || t(locale, "subscribeFailed"));
        return;
      }

      localStorage.setItem(STORAGE_KEY, "1");
      setStatus("success");
      setMessage(data.message || t(locale, "newsletterConfirmed"));
      setEmail("");
    } catch {
      setStatus("error");
      setMessage(t(locale, "networkError"));
    }
  }

  if (status === "already") {
    return (
      <p className="font-label text-[11px] font-bold uppercase text-accent-teal">
        {t(locale, "alreadySubscribed")}
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
