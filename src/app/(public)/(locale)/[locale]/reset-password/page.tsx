"use client";

import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useLocaleContext } from "@/hooks/useLocaleContext";
import { hrefForLocale } from "@/lib/locale-routing";

const MIN_LENGTH = 8;

export default function LocalizedResetPasswordPage() {
  const locale = useLocaleContext();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() || "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState("");

  const copy =
    locale === "fr"
      ? {
          kicker: "Espace rédaction",
          title: "Nouveau mot de passe",
          deck: "Choisissez un nouveau mot de passe pour votre compte.",
          missingToken: "Ce lien est invalide ou a expiré. Demandez un nouveau lien.",
          shortPassword: `Le mot de passe doit contenir au moins ${MIN_LENGTH} caractères.`,
          mismatch: "Les mots de passe ne correspondent pas.",
          passwordLabel: "Nouveau mot de passe",
          confirmLabel: "Confirmer le mot de passe",
          submitting: "Enregistrement...",
          submit: "Mettre à jour le mot de passe",
          successTitle: "Mot de passe mis à jour",
          successMessage: "Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter.",
          login: "Se connecter",
          forgotLink: "Demander un nouveau lien",
        }
      : {
          kicker: "Newsroom access",
          title: "New password",
          deck: "Choose a new password for your account.",
          missingToken: "This link is invalid or has expired. Please request a new one.",
          shortPassword: `Password must be at least ${MIN_LENGTH} characters.`,
          mismatch: "Passwords do not match.",
          passwordLabel: "New password",
          confirmLabel: "Confirm password",
          submitting: "Saving...",
          submit: "Update password",
          successTitle: "Password updated",
          successMessage: "Your password has been changed successfully. You can now sign in.",
          login: "Sign in",
          forgotLink: "Request a new link",
        };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < MIN_LENGTH) {
      setError(copy.shortPassword);
      return;
    }
    if (password !== confirmPassword) {
      setError(copy.mismatch);
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
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
              {copy.login}
            </Link>
          </div>
        ) : !token ? (
          <div className="space-y-4">
            <h1 className="font-headline text-4xl font-extrabold text-foreground">{copy.title}</h1>
            <p className="font-body text-base text-primary">{copy.missingToken}</p>
            <Link
              href={hrefForLocale("/forgot-password", locale)}
              className="ink-link font-label font-bold text-primary"
            >
              {copy.forgotLink}
            </Link>
          </div>
        ) : (
          <>
            <h1 className="mb-2 font-headline text-4xl font-extrabold text-foreground">{copy.title}</h1>
            <p className="mb-8 font-body text-base text-muted">{copy.deck}</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label={copy.passwordLabel}
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={MIN_LENGTH}
                autoFocus
              />
              <Input
                label={copy.confirmLabel}
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={MIN_LENGTH}
              />
              {error && <p className="font-label text-sm text-primary">{error}</p>}
              <Button type="submit" className="w-full" size="lg" disabled={status === "loading"}>
                {status === "loading" ? copy.submitting : copy.submit}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
