"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useLocaleContext } from "@/hooks/useLocaleContext";
import { hrefForLocale } from "@/lib/locale-routing";

export default function LocalizedSetupAccountPage() {
  const locale = useLocaleContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() || "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const copy = {
    fr: {
      kicker: "Espace rédaction",
      title: "Activer votre compte",
      deck: "Définissez votre mot de passe pour accéder au tableau de bord.",
      missingToken: "Lien invalide ou manquant.",
      shortPassword: "Le mot de passe doit contenir au moins 6 caractères.",
      mismatch: "Les mots de passe ne correspondent pas.",
      fallbackError: "Impossible de définir le mot de passe.",
      success: "Mot de passe défini. Vous pouvez maintenant vous connecter.",
      genericError: "Une erreur est survenue.",
      password: "Nouveau mot de passe",
      confirmPassword: "Confirmer le mot de passe",
      saving: "Enregistrement...",
      submit: "Définir mon mot de passe",
      ready: "Déjà prêt ?",
      login: "Se connecter",
    },
    en: {
      kicker: "Newsroom access",
      title: "Activate your account",
      deck: "Set your password to access the dashboard.",
      missingToken: "This link is invalid or missing.",
      shortPassword: "Your password must contain at least 6 characters.",
      mismatch: "The passwords do not match.",
      fallbackError: "We could not set your password.",
      success: "Password set. You can now sign in.",
      genericError: "Something went wrong.",
      password: "New password",
      confirmPassword: "Confirm password",
      saving: "Saving...",
      submit: "Set my password",
      ready: "Ready to go?",
      login: "Sign in",
    },
  }[locale];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError(copy.missingToken);
      return;
    }

    if (password.length < 6) {
      setError(copy.shortPassword);
      return;
    }

    if (password !== confirmPassword) {
      setError(copy.mismatch);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/setup-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const payload = (await res.json()) as { error?: string; email?: string };
      if (!res.ok) {
        setError(payload.error || copy.fallbackError);
        setLoading(false);
        return;
      }

      if (payload.email) {
        const login = await signIn("credentials", {
          email: payload.email,
          password,
          redirect: false,
        });
        if (!login?.error) {
          router.push("/dashboard");
          return;
        }
      }

      setSuccess(copy.success);
      setLoading(false);
    } catch {
      setError(copy.genericError);
      setLoading(false);
    }
  }

  return (
    <div className="newspaper-shell flex min-h-[80vh] items-center justify-center py-10">
      <div className="w-full max-w-md border-t-2 border-border-strong pt-6">
        <div className="mb-8 text-center">
          <p className="page-kicker mb-3">{copy.kicker}</p>
          <h1 className="font-headline text-4xl font-extrabold text-foreground">
            {copy.title}
          </h1>
          <p className="mt-2 font-body text-lg text-muted">{copy.deck}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label={copy.password}
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          <Input
            label={copy.confirmPassword}
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />

          {error ? (
            <p className="text-center font-label text-sm text-primary">{error}</p>
          ) : null}

          {success ? (
            <p className="text-center font-label text-sm text-foreground">{success}</p>
          ) : null}

          <Button type="submit" className="w-full" size="lg" disabled={loading || !token}>
            {loading ? copy.saving : copy.submit}
          </Button>
        </form>

        <p className="mt-8 text-center font-body text-base text-muted">
          {copy.ready}{" "}
          <Link href={hrefForLocale("/login", locale)} className="ink-link font-label font-bold text-primary">
            {copy.login}
          </Link>
        </p>
      </div>
    </div>
  );
}
