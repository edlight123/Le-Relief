"use client";

import { useState } from "react";
import SocialLinks from "@/components/public/SocialLinks";
import { useLocaleContext } from "@/hooks/useLocaleContext";

export default function LocalizedContactPage() {
  const locale = useLocaleContext();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const isFr = locale === "fr";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    try {
      const formData = new FormData(e.currentTarget);
      const body = Object.fromEntries(formData);
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
      (e.target as HTMLFormElement).reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="newspaper-shell py-10 sm:py-14">
      <header className="mb-10 border-t-2 border-border-strong pt-5">
        <p className="page-kicker mb-3">Contact</p>
        <h1 className="editorial-title max-w-4xl text-5xl text-foreground sm:text-7xl">
          {isFr ? "Contactez-nous" : "Contact us"}
        </h1>
      </header>

      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="border-t border-border-strong pt-4">
          <h2 className="font-headline text-3xl font-extrabold text-foreground">
            {isFr ? "Écrire à la rédaction" : "Write to the newsroom"}
          </h2>
          <div className="mt-8 border-t border-border-subtle pt-5">
            <h2 className="mb-4 font-label text-xs font-extrabold uppercase text-foreground">
              {isFr ? "Suivez-nous" : "Follow us"}
            </h2>
            <SocialLinks />
          </div>
        </aside>

        <div className="border-t-2 border-border-strong pt-5">
          {status === "success" ? (
            <div
              role="status"
              aria-live="polite"
              className="rounded border border-green-300 bg-green-50 p-6 font-body text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
            >
              {isFr
                ? "Votre message a bien été envoyé. Nous vous répondrons dans les plus brefs délais."
                : "Your message has been sent. We will get back to you shortly."}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {status === "error" && (
                <div
                  role="alert"
                  className="rounded border border-red-300 bg-red-50 p-4 font-body text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
                >
                  {isFr
                    ? "Une erreur est survenue. Veuillez réessayer."
                    : "An error occurred. Please try again."}
                </div>
              )}
              <div>
                <label htmlFor="name" className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground">
                  {isFr ? "Nom" : "Name"}
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  disabled={status === "loading"}
                  className="w-full border border-border-subtle bg-surface px-4 py-3 focus:outline-none focus:ring-2 focus:ring-foreground disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor="email" className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground">
                  {isFr ? "Courriel" : "Email"}
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  disabled={status === "loading"}
                  className="w-full border border-border-subtle bg-surface px-4 py-3 focus:outline-none focus:ring-2 focus:ring-foreground disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor="message" className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground">
                  {isFr ? "Message" : "Message"}
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  disabled={status === "loading"}
                  className="w-full resize-none border border-border-subtle bg-surface px-4 py-3 focus:outline-none focus:ring-2 focus:ring-foreground disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={status === "loading"}
                className="border border-border-strong bg-foreground px-6 py-3 font-label text-xs font-extrabold uppercase text-background disabled:opacity-50"
              >
                {status === "loading"
                  ? isFr ? "Envoi…" : "Sending…"
                  : isFr ? "Envoyer" : "Send"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
