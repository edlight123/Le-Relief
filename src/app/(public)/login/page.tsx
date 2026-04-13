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
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            Bon retour
          </h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
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
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Connexion en cours..." : "Se Connecter"}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-subtle" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-surface text-neutral-400">
                ou continuer avec
              </span>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="flex items-center justify-center w-full px-4 py-2.5 border border-border-subtle rounded-lg hover:bg-surface-elevated transition-colors text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              Google
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Pas encore de compte ?{" "}
          <Link
            href="/signup"
            className="font-medium text-primary hover:text-primary-light"
          >
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
