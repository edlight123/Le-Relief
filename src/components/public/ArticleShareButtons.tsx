"use client";

import { Share2 } from "lucide-react";
import CopyLinkButton from "@/components/public/CopyLinkButton";
import { useLocaleContext } from "@/hooks/useLocaleContext";

interface ArticleShareButtonsProps {
  url: string;
  title: string;
  variant?: "sidebar" | "footer";
}

/**
 * Social sharing buttons for articles — share across WhatsApp, Facebook, X, Email, and Copy Link
 * Matches EdLight's prominent sharing UX pattern
 */
export default function ArticleShareButtons({
  url,
  title,
  variant = "sidebar",
}: ArticleShareButtonsProps) {
  const locale = useLocaleContext();
  const shareText = `${title} — ${url}`;

  const platforms = [
    {
      name: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      label: locale === "fr" ? "Partager sur WhatsApp" : "Share on WhatsApp",
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      label: locale === "fr" ? "Partager sur Facebook" : "Share on Facebook",
    },
    {
      name: "X",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      label: locale === "fr" ? "Partager sur X" : "Share on X",
    },
    {
      name: "Email",
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
      label: locale === "fr" ? "Envoyer par courriel" : "Share via email",
    },
  ];

  if (variant === "footer") {
    return (
      <div className="flex flex-wrap gap-2">
        {platforms.map((platform) => (
          <a
            key={platform.name}
            href={platform.href}
            target={platform.name === "Email" ? undefined : "_blank"}
            rel={platform.name === "Email" ? undefined : "noopener noreferrer"}
            className="border border-border-subtle px-3 py-2 font-label text-xs font-bold uppercase text-muted transition-all hover:bg-surface-elevated hover:text-foreground"
            title={platform.label}
          >
            {platform.name}
          </a>
        ))}
      </div>
    );
  }

  // Default sidebar variant
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Share2 className="h-4 w-4 text-foreground" />
        <p className="section-kicker">
          {locale === "fr" ? "Partager" : "Share"}
        </p>
      </div>
      <div className="flex flex-col gap-3 font-label text-xs font-bold uppercase">
        {platforms.map((platform) => (
          <a
            key={platform.name}
            href={platform.href}
            target={platform.name === "Email" ? undefined : "_blank"}
            rel={platform.name === "Email" ? undefined : "noopener noreferrer"}
            className="ink-link text-muted transition-colors hover:text-primary"
          >
            {platform.label}
          </a>
        ))}
        <CopyLinkButton url={url} />
      </div>
    </section>
  );
}
