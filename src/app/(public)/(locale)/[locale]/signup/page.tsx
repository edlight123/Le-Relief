"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useLocaleContext } from "@/hooks/useLocaleContext";

export default function LocalizedSignupPage() {
  const locale = useLocaleContext();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || (locale === "fr" ? "Une erreur est survenue" : "An error occurred"));
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        router.push(`/${locale}/login`);
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError(locale === "fr" ? "Une erreur est survenue" : "An error occurred");
      setLoading(false);
    }
  }

  return (
    <div className="newspaper-shell flex min-h-[80vh] items-center justify-center py-10">
      <div className="w-full max-w-md border-t-2 border-border-strong pt-6">
        <h1 className="mb-6 text-center font-headline text-4xl font-extrabold text-foreground">
          {locale === "fr" ? "Créer un compte" : "Create account"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label={locale === "fr" ? "Nom" : "Name"} id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label={locale === "fr" ? "Courriel" : "Email"} id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label={locale === "fr" ? "Mot de passe" : "Password"} id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          {error && <p className="text-center font-label text-sm text-primary">{error}</p>}
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? (locale === "fr" ? "Création..." : "Creating...") : (locale === "fr" ? "S'inscrire" : "Sign up")}
          </Button>
        </form>

        <p className="mt-8 text-center font-body text-base text-muted">
          {locale === "fr" ? "Déjà un compte ?" : "Already have an account?"}{" "}
          <Link href={`/${locale}/login`} className="ink-link font-label font-bold text-primary">
            {locale === "fr" ? "Se connecter" : "Sign in"}
          </Link>
        </p>
      </div>
    </div>
  );
}
