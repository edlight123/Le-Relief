import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/config/site.config";
import SocialLinks from "@/components/public/SocialLinks";
import NewsletterSignup from "@/components/public/NewsletterSignup";

export default function Footer() {
  return (
    <footer className="mt-16 border-t-4 border-border-strong bg-surface-newsprint pb-10 pt-8 sm:mt-24 sm:pt-12">
      <div className="newspaper-shell">
        <div className="mb-8 border-b border-border-strong pb-6 text-center">
          <Link href="/" className="inline-flex items-center justify-center gap-3">
            <Image
              src="/logo.png"
              alt="Le Relief"
              width={34}
              height={34}
              className="rounded-sm"
            />
            <span className="font-headline text-4xl font-extrabold leading-none text-foreground sm:text-5xl">
              {siteConfig.name}
            </span>
          </Link>
          <p className="mx-auto mt-3 max-w-2xl font-label text-xs font-semibold uppercase text-muted">
            {siteConfig.description}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 font-label text-sm md:grid-cols-4">
          <div className="md:border-r md:border-border-subtle md:pr-8">
            <h4 className="mb-4 border-b border-border-subtle pb-3 text-xs font-extrabold uppercase text-foreground">
              Édition
            </h4>
            <p className="font-body text-base leading-relaxed text-muted">
              Une rédaction numérique pour lire Haïti avec précision, contexte
              et responsabilité éditoriale.
            </p>
            <div className="mt-6">
              <SocialLinks />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="border-b border-border-subtle pb-3 text-xs font-extrabold uppercase text-foreground">
              Navigation
            </h4>
            {siteConfig.nav.public.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="ink-link text-muted"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="border-b border-border-subtle pb-3 text-xs font-extrabold uppercase text-foreground">
              Institutionnel
            </h4>
            <Link
              href="/about"
              className="ink-link text-muted"
            >
              À propos
            </Link>
            <Link
              href="/politique-editoriale"
              className="ink-link text-muted"
            >
              Politique éditoriale
            </Link>
            <Link
              href="/corrections"
              className="ink-link text-muted"
            >
              Corrections
            </Link>
            <Link
              href="/traduction-ia"
              className="ink-link text-muted"
            >
              Traduction assistée par IA
            </Link>
            <Link
              href="/privacy"
              className="ink-link text-muted"
            >
              Confidentialité
            </Link>
            <a
              href="/feed.xml"
              className="ink-link text-muted"
              type="application/rss+xml"
            >
              Flux RSS
            </a>
            <Link
              href="/contact"
              className="ink-link text-muted"
            >
              Contact
            </Link>
          </div>

          <div className="flex flex-col gap-6">
            <h4 className="border-b border-border-subtle pb-3 text-xs font-extrabold uppercase text-foreground">
              Lettre
            </h4>
            <p className="font-body text-base leading-relaxed text-muted">
              Recevez les grands titres et analyses de la semaine.
            </p>
            <NewsletterSignup />
          </div>

          <div className="col-span-full mt-8 border-t border-border-strong pt-6 text-center">
            <p className="font-label text-[10px] font-semibold uppercase text-muted">
              &copy; {new Date().getFullYear()} {siteConfig.name}. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
