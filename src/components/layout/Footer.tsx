"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site.config";
import SocialLinks from "@/components/public/SocialLinks";
import NewsletterSignup from "@/components/public/NewsletterSignup";

export default function Footer() {
  const pathname = usePathname();
  const locale = pathname === "/en" || pathname.startsWith("/en/") ? "en" : "fr";
  const t = (fr: string, en: string) => (locale === "fr" ? fr : en);

  const institutionLinks = [
    { label: t("À propos", "About Us"), href: "/about" },
    { label: t("Politique éditoriale", "Editorial Guidelines"), href: "/politique-editoriale" },
    { label: t("Corrections", "Corrections"), href: "/corrections" },
    { label: t("Traduction assistée", "AI-assisted translation"), href: "/traduction-ia" },
  ];

  const newsletterLinks = [
    { label: t("Lettre quotidienne", "Daily Briefing"), href: "/#newsletter" },
    { label: t("Édition du week-end", "Weekend Edition"), href: "/#newsletter" },
    { label: t("Analyses & dossiers", "Analysis & explainers"), href: "/categories" },
    { label: t("Flux RSS", "RSS Feed"), href: "/feed.xml" },
  ];

  const supportLinks = [
    { label: t("Contact", "Contact"), href: "/contact" },
    { label: t("Recherche", "Search"), href: "/search" },
    { label: t("Catégories", "Categories"), href: "/categories" },
    { label: t("Auteurs", "Authors"), href: "/auteurs" },
  ];

  const legalLinks = [
    { label: t("Confidentialité", "Privacy"), href: "/privacy" },
    { label: t("Cookies", "Cookies"), href: "/privacy" },
    { label: t("Accessibilité", "Accessibility"), href: "/about" },
  ];

  return (
    <footer className="mt-16 double-rule-top bg-surface-newsprint pb-10 pt-12 sm:mt-24">
      <div className="newspaper-shell">
        <div className="grid grid-cols-2 gap-x-10 gap-y-10 border-b border-border-subtle pb-12 md:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href={`/${locale}`} className="block">
              <span className="font-headline text-2xl font-extrabold italic leading-none text-foreground">
                {siteConfig.name}
              </span>
              <span className="mt-2 block h-px w-12 bg-foreground" />
            </Link>
            <p className="mt-4 font-body text-sm leading-relaxed text-muted">
              {t(
                "Une rédaction numérique pour lire Haïti avec précision, contexte et responsabilité éditoriale.",
                "A digital newsroom to read Haiti with precision, context and editorial responsibility.",
              )}
            </p>
            <div className="mt-6">
              <SocialLinks />
            </div>
          </div>

          {/* Institution */}
          <div>
            <h5 className="mb-4 font-label text-[11px] font-extrabold uppercase tracking-widest text-foreground">
              {t("L'institution", "The Institution")}
            </h5>
            <ul className="space-y-3 font-body text-sm">
              {institutionLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="ink-link text-muted">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletters */}
          <div>
            <h5 className="mb-4 font-label text-[11px] font-extrabold uppercase tracking-widest text-foreground">
              {t("Lettres", "Newsletters")}
            </h5>
            <ul className="space-y-3 font-body text-sm">
              {newsletterLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="ink-link text-muted">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h5 className="mb-4 font-label text-[11px] font-extrabold uppercase tracking-widest text-foreground">
              {t("Aide", "Support")}
            </h5>
            <ul className="space-y-3 font-body text-sm">
              {supportLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="ink-link text-muted">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal + signup */}
          <div>
            <h5 className="mb-4 font-label text-[11px] font-extrabold uppercase tracking-widest text-foreground">
              {t("Mentions légales", "Legal")}
            </h5>
            <ul className="space-y-3 font-body text-sm">
              {legalLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="ink-link text-muted">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 border-t border-border-subtle pt-6">
              <p className="mb-3 font-label text-[11px] font-extrabold uppercase tracking-widest text-foreground">
                {t("S'inscrire à la lettre", "Subscribe")}
              </p>
              <NewsletterSignup context="footer" />
            </div>
          </div>
        </div>

        <div className="pt-6 text-center">
          <p className="font-label text-[10px] font-semibold uppercase tracking-[0.25em] text-muted">
            © {new Date().getFullYear()} {siteConfig.name}.{" "}
            {t("Tous droits réservés.", "All rights reserved.")}{" "}
            {t("Une rédaction indépendante.", "An independent newsroom.")}
          </p>
        </div>
      </div>
    </footer>
  );
}
