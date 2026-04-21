"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site.config";
import SocialLinks from "@/components/public/SocialLinks";
import NewsletterSignup from "@/components/public/NewsletterSignup";

export default function Footer() {
  const pathname = usePathname();
  const locale = pathname === "/en" || pathname.startsWith("/en/") ? "en" : "fr";
  const withLocale = (href: string) => (href === "/" ? `/${locale}` : `/${locale}${href}`);

  return (
    <footer className="mt-16 border-t-4 border-border-strong bg-surface-newsprint pb-10 pt-8 sm:mt-24 sm:pt-12">
      <div className="newspaper-shell">
        <div className="mb-8 border-b border-border-strong pb-6 text-center">
          <Link href={`/${locale}`} className="inline-flex items-center justify-center gap-3">
            <Image
              src="/logo.png"
              alt="Le Relief"
              width={34}
              height={34}
                            sizes="34px"
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
              {locale === "en" ? " / Newsroom" : ""}
            </h4>
            <p className="font-body text-base leading-relaxed text-muted">
              {locale === "fr"
                ? "Une rédaction numérique pour lire Haïti avec précision, contexte et responsabilité éditoriale."
                : "A digital newsroom to read Haiti with precision, context and editorial responsibility."}
            </p>
            <div className="mt-6">
              <SocialLinks />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="border-b border-border-subtle pb-3 text-xs font-extrabold uppercase text-foreground">
              {locale === "fr" ? "Navigation" : "Navigation"}
            </h4>
            {(locale === "fr"
              ? siteConfig.nav.public
              : [
                  { label: "Home", href: "/" },
                  { label: "Categories", href: "/categories" },
                  { label: "Search", href: "/search" },
                  { label: "About", href: "/about" },
                  { label: "Contact", href: "/contact" },
                ]).map((item) => (
              <Link
                key={item.href}
                href={withLocale(item.href)}
                className="ink-link text-muted"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="border-b border-border-subtle pb-3 text-xs font-extrabold uppercase text-foreground">
              {locale === "fr" ? "Institutionnel" : "Institutional"}
            </h4>
            <Link
              href={withLocale("/about")}
              className="ink-link text-muted"
            >
              {locale === "fr" ? "À propos" : "About"}
            </Link>
            <Link
              href={withLocale("/politique-editoriale")}
              className="ink-link text-muted"
            >
              {locale === "fr" ? "Politique éditoriale" : "Editorial policy"}
            </Link>
            <Link
              href={withLocale("/corrections")}
              className="ink-link text-muted"
            >
              Corrections
            </Link>
            <Link
              href={withLocale("/traduction-ia")}
              className="ink-link text-muted"
            >
              {locale === "fr" ? "Traduction assistée par IA" : "AI-assisted translation"}
            </Link>
            <Link
              href={withLocale("/privacy")}
              className="ink-link text-muted"
            >
              {locale === "fr" ? "Confidentialité" : "Privacy"}
            </Link>
            <a
              href="/feed.xml"
              className="ink-link text-muted"
              type="application/rss+xml"
            >
              Flux RSS
            </a>
            <Link
              href={withLocale("/contact")}
              className="ink-link text-muted"
            >
              Contact
            </Link>
          </div>

          <div className="flex flex-col gap-6">
            <h4 className="border-b border-border-subtle pb-3 text-xs font-extrabold uppercase text-foreground">
              {locale === "fr" ? "Lettre" : "Newsletter"}
            </h4>
            <p className="font-body text-base leading-relaxed text-muted">
              {locale === "fr"
                ? "Recevez les grands titres et analyses de la semaine."
                : "Get major headlines and analysis of the week."}
            </p>
            <NewsletterSignup context="footer" />
          </div>

          <div className="col-span-full mt-8 border-t border-border-strong pt-6 text-center">
            <p className="font-label text-[10px] font-semibold uppercase text-muted">
              &copy; {new Date().getFullYear()} {siteConfig.name}. {locale === "fr" ? "Tous droits réservés." : "All rights reserved."}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
