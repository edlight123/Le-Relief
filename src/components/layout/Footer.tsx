import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/config/site.config";
import SocialLinks from "@/components/public/SocialLinks";

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
              unoptimized
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
              Une rédaction numérique pour lire Haïti avec précision, contexte et sang-froid.
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
              Légal
            </h4>
            <Link
              href="/privacy"
              className="ink-link text-muted"
            >
              Confidentialité
            </Link>
            <Link
              href="/contact"
              className="ink-link text-muted"
            >
              Contact
            </Link>
            <Link
              href="/about"
              className="ink-link text-muted"
            >
              À Propos
            </Link>
          </div>

          <div className="flex flex-col gap-6">
            <h4 className="border-b border-border-subtle pb-3 text-xs font-extrabold uppercase text-foreground">
              Lettre
            </h4>
            <p className="font-body text-base leading-relaxed text-muted">
              Recevez les grands titres et analyses de la semaine.
            </p>
            <div className="relative">
              <input
                className="w-full border-0 border-b-2 border-border-strong bg-transparent px-0 py-2 font-label text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
                placeholder="Adresse email"
                type="email"
              />
              <button className="absolute right-0 top-1/2 -translate-y-1/2 text-primary transition-colors hover:text-foreground">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
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
