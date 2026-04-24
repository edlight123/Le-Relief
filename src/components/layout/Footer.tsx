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

  return (
    <footer className="mt-16 border-t-4 border-border-strong bg-surface-newsprint pb-8 pt-10 sm:mt-24 sm:pt-14">
      <div className="newspaper-shell">
        {/* Footer masthead */}
        <div className="mb-10 border-b border-border-strong pb-8 text-center">
          <Link href="/" className="inline-flex items-center justify-center gap-3">
            <Image
              src="/logo.png"
              alt="Le Relief"
              width={40}
              height={40}
              sizes="40px"
              className="rounded-sm"
            />
            <span
              className="font-headline text-5xl font-extrabold leading-none text-foreground sm:text-6xl"
              style={{ letterSpacing: "-0.02em" }}
            >
              {siteConfig.name}
            </span>
          </Link>
          <p className="editorial-deck mx-auto mt-4 max-w-xl font-body text-base sm:text-lg">
            {locale === "fr"
                ? "Une rédaction numérique pour lire Haïti avec précision, contexte et responsabilité éditoriale."
              : "A digital newsroom to read Haiti with precision, context and editorial responsibility."}
          </p>
        </div>

        {/* 4-column link grid */}
        <div className="grid grid-cols-1 gap-10 font-label text-sm md:grid-cols-4 md:gap-8">
          <div className="md:border-r md:border-border-subtle md:pr-8">
            <h4 className="mb-4 font-label text-[11px] font-extrabold uppercase tracking-[1.4px] text-primary">
              {locale === "fr" ? "La rédaction" : "The newsroom"}
            </h4>
            <p className="font-body text-[15px] italic leading-relaxed text-muted">
              {locale === "fr"
                ? "Port-au-Prince · Édition numérique"
                : "Port-au-Prince · Digital edition"}
            </p>
            <div className="mt-5">
              <SocialLinks />
            </div>
          </div>

          <div className="flex flex-col gap-3 md:border-r md:border-border-subtle md:pr-8">
            <h4 className="mb-1 font-label text-[11px] font-extrabold uppercase tracking-[1.4px] text-primary">
              {locale === "fr" ? "Sections" : "Sections"}
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
                href={item.href}
                className="ink-link font-body text-[15px] not-italic text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-3 md:border-r md:border-border-subtle md:pr-8">
            <h4 className="mb-1 font-label text-[11px] font-extrabold uppercase tracking-[1.4px] text-primary">
              {locale === "fr" ? "Institution" : "Institutional"}
            </h4>
            <Link href="/about" className="ink-link font-body text-[15px] text-foreground">
              {locale === "fr" ? "À propos" : "About"}
            </Link>
            <Link href="/politique-editoriale" className="ink-link font-body text-[15px] text-foreground">
              {locale === "fr" ? "Politique éditoriale" : "Editorial policy"}
            </Link>
            <Link href="/corrections" className="ink-link font-body text-[15px] text-foreground">
              Corrections
            </Link>
            <Link href="/traduction-ia" className="ink-link font-body text-[15px] text-foreground">
              {locale === "fr" ? "Traduction IA" : "AI translation"}
            </Link>
            <Link href="/privacy" className="ink-link font-body text-[15px] text-foreground">
              {locale === "fr" ? "Confidentialité" : "Privacy"}
            </Link>
            <a
              href="/feed.xml"
              className="ink-link font-body text-[15px] text-foreground"
              type="application/rss+xml"
            >
              RSS
            </a>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="mb-1 font-label text-[11px] font-extrabold uppercase tracking-[1.4px] text-primary">
              {locale === "fr" ? "Lettre du Relief" : "Newsletter"}
            </h4>
            <p className="font-body text-[15px] italic leading-relaxed text-muted">
              {locale === "fr"
                ? "Les grands titres et analyses, chaque semaine."
                : "Major headlines and analysis, every week."}
            </p>
            <NewsletterSignup context="footer" />
          </div>
        </div>

        {/* ISSN-style imprint */}
        <div className="mt-12 border-t border-border-strong pt-5 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[2px] text-muted">
            {siteConfig.name} · Port-au-Prince · {locale === "fr" ? "Édition numérique" : "Digital edition"} · © {new Date().getFullYear()}
          </p>
          <p className="mt-2 font-body text-xs italic text-muted">
            {locale === "fr"
              ? "Lire en\u00a0:"
              : "Read in:"}{" "}
            <Link href="/fr" className={`ink-link ${locale === "fr" ? "text-foreground" : "text-muted"}`}>
              Français
            </Link>
            {" · "}
            <Link href="/en" className={`ink-link ${locale === "en" ? "text-foreground" : "text-muted"}`}>
              English
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
