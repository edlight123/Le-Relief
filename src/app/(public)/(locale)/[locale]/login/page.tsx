"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useLocaleContext } from "@/hooks/useLocaleContext";
import { hrefForLocale } from "@/lib/locale-routing";

export default function LocalizedLoginPage() {
  const locale = useLocaleContext();
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
      setError(locale === "fr" ? "Identifiants invalides" : "Invalid credentials");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="newspaper-shell flex min-h-[80vh] items-center justify-center py-10">
      <div className="w-full max-w-md border-t-2 border-border-strong pt-6">
        <div className="mb-8 text-center">
          <h1 className="font-headline text-4xl font-extrabold text-foreground">
            {locale === "fr" ? "Bon retour" : "Welcome back"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label={locale === "fr" ? "Courriel" : "Email"} id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label={locale === "fr" ? "Mot de passe" : "Password"} id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="text-center font-label text-sm text-primary">{error}</p>}
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? (locale === "fr" ? "Connexion..." : "Signing in...") : (locale === "fr" ? "Se connecter" : "Sign in")}
          </Button>
        </form>

        <p className="mt-6 text-center font-body text-sm text-muted">
          <Link href={hrefForLocale("/forgot-password", locale)} className="ink-link font-label font-bold text-primary">
            {locale === "fr" ? "Mot de passe oublié ?" : "Forgot your password?"}
          </Link>
        </p>

        <p className="mt-3 text-center font-body text-sm text-muted">
          {locale === "fr" ? "Invitation reçue ?" : "Got an invite?"}{" "}
          <Link href={hrefForLocale("/setup-account", locale)} className="ink-link font-label font-bold text-primary">
            {locale === "fr" ? "Activer mon compte" : "Activate my account"}
          </Link>
        </p>
      </div>
    </div>
  );
}
