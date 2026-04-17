"use client";

import { useState } from "react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("saving");
    setMessage("");

    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Échec de l'inscription");
        return;
      }

      setStatus("success");
      setMessage(data.message || "Inscription confirmée.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Erreur réseau. Réessayez.");
    }
  }

  return (
    <form className="relative" onSubmit={handleSubmit}>
      <input
        className="w-full border-0 border-b-2 border-border-strong bg-transparent px-0 py-2 pr-9 font-label text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
        placeholder="Adresse email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        aria-label="Adresse email"
      />
      <button
        type="submit"
        disabled={status === "saving"}
        className="absolute right-0 top-1/2 -translate-y-1/2 text-primary transition-colors hover:text-foreground disabled:opacity-50"
        aria-label="S'inscrire à la newsletter"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </button>
      {message ? (
        <p
          className={`mt-2 font-label text-[11px] font-semibold uppercase ${
            status === "success" ? "text-accent-teal" : "text-primary"
          }`}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
