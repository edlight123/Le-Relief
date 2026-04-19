"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Courriel ou mot de passe invalide");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="newspaper-shell flex min-h-[80vh] items-center justify-center py-10">
      <div className="w-full max-w-md border-t-2 border-border-strong pt-6">
        <div className="mb-8 text-center">
          <p className="page-kicker mb-3">Espace rédaction</p>
          <h1 className="font-headline text-4xl font-extrabold text-foreground">
            Bon retour
          </h1>
          <p className="mt-2 font-body text-lg text-muted">
            Connectez-vous pour accéder à votre tableau de bord
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Courriel"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            required
          />
          <Input
            label="Mot de passe"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          {error && (
            <p className="text-center font-label text-sm text-primary">{error}</p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Connexion en cours..." : "Se connecter"}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-subtle" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface px-2 text-muted">
                ou continuer avec
              </span>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="flex w-full items-center justify-center border border-border-subtle px-4 py-3 font-label text-sm font-bold text-foreground transition-colors hover:bg-surface-elevated"
            >
              Google
            </button>
          </div>
        </div>

        <p className="mt-8 text-center font-body text-base text-muted">
          Pas encore de compte ?{" "}
          <Link
            href="/signup"
            className="ink-link font-label font-bold text-primary"
          >
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
