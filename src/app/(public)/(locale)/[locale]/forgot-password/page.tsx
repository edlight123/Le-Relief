"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useLocaleContext } from "@/hooks/useLocaleContext";
import { hrefForLocale } from "@/lib/locale-routing";

export default function LocalizedForgotPasswordPage() {
  const locale = useLocaleContext();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState("");

  const copy =
    locale === "fr"
      ? {
          kicker: "Espace rédaction",
          title: "Mot de passe oublié",
          deck: "Entrez votre adresse courriel. Si elle est enregistrée, vous recevrez un lien de réinitialisation.",
          emailLabel: "Adresse courriel",
          submitting: "Envoi en cours...",
          submit: "Envoyer le lien",
          successTitle: "Courriel envoyé",
          successMessage:
            "Si cette adresse est associée à un compte, un lien de réinitialisation vient d'être envoyé. Vérifiez votre boîte de réception (et vos spams).",
          back: "Retour à la connexion",
        }
      : {
          kicker: "Newsroom access",
          title: "Forgot password",
          deck: "Enter your email address. If it's registered, you'll receive a reset link.",
          emailLabel: "Email address",
          submitting: "Sending...",
          submit: "Send reset link",
          successTitle: "Email sent",
          successMessage:
            "If that address is linked to an account, a reset link has just been sent. Check your inbox (and spam folder).",
          back: "Back to sign in",
        };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("loading");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || (locale === "fr" ? "Une erreur est survenue." : "An error occurred."));
        setStatus("idle");
        return;
      }

      setStatus("done");
    } catch {
      setError(locale === "fr" ? "Une erreur est survenue." : "An error occurred.");
      setStatus("idle");
    }
  }

  return (
    <div className="newspaper-shell flex min-h-[80vh] items-center justify-center py-10">
      <div className="w-full max-w-md border-t-2 border-border-strong pt-6">
        <p className="mb-2 font-label text-[11px] font-extrabold uppercase tracking-widest text-primary">
          {copy.kicker}
        </p>

        {status === "done" ? (
          <div className="space-y-4">
            <h1 className="font-headline text-4xl font-extrabold text-foreground">{copy.successTitle}</h1>
            <p className="font-body text-base text-muted">{copy.successMessage}</p>
            <Link href={hrefForLocale("/login", locale)} className="ink-link font-label font-bold text-primary">
              {copy.back}
            </Link>
          </div>
        ) : (
          <>
            <h1 className="mb-2 font-headline text-4xl font-extrabold text-foreground">{copy.title}</h1>
            <p className="mb-8 font-body text-base text-muted">{copy.deck}</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label={copy.emailLabel}
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              {error && <p className="font-label text-sm text-primary">{error}</p>}
              <Button type="submit" className="w-full" size="lg" disabled={status === "loading"}>
                {status === "loading" ? copy.submitting : copy.submit}
              </Button>
            </form>

            <p className="mt-8 text-center font-body text-sm text-muted">
              <Link href={hrefForLocale("/login", locale)} className="ink-link font-label font-bold text-primary">
                {copy.back}
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
