"use client";

import Link from "next/link";
import { useLocaleContext } from "@/hooks/useLocaleContext";
import { hrefForLocale } from "@/lib/locale-routing";

export default function LocalizedSignupPage() {
  const locale = useLocaleContext();

  return (
    <div className="newspaper-shell flex min-h-[80vh] items-center justify-center py-10">
      <div className="w-full max-w-md border-t-2 border-border-strong pt-6 text-center">
        <h1 className="mb-4 font-headline text-4xl font-extrabold text-foreground">
          {locale === "fr" ? "Accès réservé" : "Access restricted"}
        </h1>
        <p className="mb-8 font-body text-base text-muted">
          {locale === "fr"
            ? "L'inscription publique est désactivée. Les comptes sont créés par un administrateur."
            : "Public sign-up is disabled. Accounts are created by an administrator."}
        </p>
        <Link
          href={hrefForLocale("/login", locale)}
          className="ink-link font-label font-bold text-primary"
        >
          {locale === "fr" ? "Retour à la connexion" : "Back to sign in"}
        </Link>
      </div>
    </div>
  );
}

