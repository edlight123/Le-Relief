"use client";

import SocialLinks from "@/components/public/SocialLinks";
import { useLocaleContext } from "@/hooks/useLocaleContext";

export default function LocalizedContactPage() {
  const locale = useLocaleContext();

  return (
    <div className="newspaper-shell py-10 sm:py-14">
      <header className="mb-10 border-t-2 border-border-strong pt-5">
        <p className="page-kicker mb-3">Contact</p>
        <h1 className="editorial-title max-w-4xl text-5xl text-foreground sm:text-7xl">
          {locale === "fr" ? "Contactez-nous" : "Contact us"}
        </h1>
      </header>

      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="border-t border-border-strong pt-4">
          <h2 className="font-headline text-3xl font-extrabold text-foreground">
            {locale === "fr" ? "Écrire à la rédaction" : "Write to the newsroom"}
          </h2>
          <div className="mt-8 border-t border-border-subtle pt-5">
            <h2 className="mb-4 font-label text-xs font-extrabold uppercase text-foreground">
              {locale === "fr" ? "Suivez-nous" : "Follow us"}
            </h2>
            <SocialLinks />
          </div>
        </aside>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const body = Object.fromEntries(formData);
            await fetch("/api/contact", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
          }}
          className="space-y-5 border-t-2 border-border-strong pt-5"
        >
          <div>
            <label htmlFor="name" className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground">
              {locale === "fr" ? "Nom" : "Name"}
            </label>
            <input id="name" name="name" required className="w-full border border-border-subtle bg-surface px-4 py-3" />
          </div>
          <div>
            <label htmlFor="email" className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground">
              {locale === "fr" ? "Courriel" : "Email"}
            </label>
            <input id="email" type="email" name="email" required className="w-full border border-border-subtle bg-surface px-4 py-3" />
          </div>
          <div>
            <label htmlFor="message" className="mb-2 block font-label text-xs font-extrabold uppercase text-foreground">
              {locale === "fr" ? "Message" : "Message"}
            </label>
            <textarea id="message" name="message" rows={5} required className="w-full resize-none border border-border-subtle bg-surface px-4 py-3" />
          </div>
          <button type="submit" className="border border-border-strong bg-foreground px-6 py-3 font-label text-xs font-extrabold uppercase text-background">
            {locale === "fr" ? "Envoyer" : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
