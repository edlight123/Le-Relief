"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function SetupAccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() || "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Lien invalide ou manquant.");
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
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
        setError(payload.error || "Impossible de définir le mot de passe.");
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

      setSuccess("Mot de passe défini. Vous pouvez maintenant vous connecter.");
      setLoading(false);
    } catch {
      setError("Une erreur est survenue.");
      setLoading(false);
    }
  }

  return (
    <div className="newspaper-shell flex min-h-[80vh] items-center justify-center py-10">
      <div className="w-full max-w-md border-t-2 border-border-strong pt-6">
        <div className="mb-8 text-center">
          <p className="page-kicker mb-3">Espace rédaction</p>
          <h1 className="font-headline text-4xl font-extrabold text-foreground">
            Activer votre compte
          </h1>
          <p className="mt-2 font-body text-lg text-muted">
            Définissez votre mot de passe pour accéder au dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Nouveau mot de passe"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          <Input
            label="Confirmer le mot de passe"
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />

          {error && (
            <p className="text-center font-label text-sm text-primary">{error}</p>
          )}

          {success && (
            <p className="text-center font-label text-sm text-foreground">{success}</p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading || !token}>
            {loading ? "Enregistrement..." : "Définir mon mot de passe"}
          </Button>
        </form>

        <p className="mt-8 text-center font-body text-base text-muted">
          Déjà prêt ?{" "}
          <Link href="/login" className="ink-link font-label font-bold text-primary">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
