import type { Metadata } from "next";
import NewsletterSignup from "@/components/public/NewsletterSignup";

export const metadata: Metadata = {
  title: "Lettre d'information — Le Relief",
  description:
    "Recevez une sélection claire des nouvelles, analyses et dossiers à lire.",
};

export default function NewsletterPage() {
  return (
    <main className="newspaper-shell flex min-h-[80vh] flex-col items-center justify-center py-16 text-center">
      <p className="page-kicker mb-3">Lettre d&apos;information</p>
      <h1 className="font-headline text-4xl font-extrabold leading-tight text-foreground">
        Recevez les sujets qui comptent.
      </h1>
      <p className="mt-4 max-w-md font-body text-base leading-relaxed text-muted">
        Une sélection claire des nouvelles, analyses et dossiers à lire.
        Directement dans votre boîte mail.
      </p>
      <div className="mt-8 w-full max-w-sm">
        <NewsletterSignup context="newsletter-page" />
      </div>
    </main>
  );
}
