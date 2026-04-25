import { Mail, Share2 } from "lucide-react";
import CopyLinkButton from "@/components/public/CopyLinkButton";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.52 3.48A11.86 11.86 0 0012.06 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.6 5.94L0 24l6.32-1.66a11.87 11.87 0 005.74 1.46h.01c6.56 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.16-3.45-8.42zM12.07 21.8h-.01a9.9 9.9 0 01-5.04-1.37l-.36-.21-3.75.99 1-3.65-.23-.38a9.87 9.87 0 01-1.52-5.28c0-5.46 4.44-9.9 9.9-9.9 2.64 0 5.11 1.03 6.98 2.92a9.8 9.8 0 012.9 6.98c0 5.45-4.44 9.9-9.87 9.9zm5.43-7.4c-.3-.15-1.78-.88-2.06-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.96 1.18-.18.2-.35.23-.65.08-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.68-2.08-.18-.3-.02-.46.13-.61.14-.14.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.63-.93-2.24-.25-.6-.5-.52-.68-.53h-.58c-.2 0-.53.08-.8.38-.28.3-1.05 1.03-1.05 2.52 0 1.48 1.08 2.92 1.23 3.12.15.2 2.1 3.2 5.09 4.49.71.31 1.26.5 1.69.64.71.23 1.36.2 1.88.12.57-.08 1.78-.73 2.03-1.43.25-.7.25-1.3.18-1.43-.08-.12-.28-.2-.58-.35z" />
    </svg>
  );
}

interface ArticleShareButtonsProps {
  url: string;
  title: string;
  locale?: "fr" | "en";
  variant?: "sidebar" | "footer";
}

/**
 * Social sharing buttons for articles — share across WhatsApp, Facebook, X, Email, and Copy Link
 * Matches EdLight's prominent sharing UX pattern
 */
export default function ArticleShareButtons({
  url,
  title,
  locale = "fr",
  variant = "sidebar",
}: ArticleShareButtonsProps) {
  const shareText = `${title} — ${url}`;

  const platforms = [
    {
      name: "WhatsApp",
      icon: WhatsAppIcon,
      href: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      label: locale === "fr" ? "Partager sur WhatsApp" : "Share on WhatsApp",
    },
    {
      name: "Facebook",
      icon: FacebookIcon,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      label: locale === "fr" ? "Partager sur Facebook" : "Share on Facebook",
    },
    {
      name: "X",
      icon: XIcon,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      label: locale === "fr" ? "Partager sur X" : "Share on X",
    },
    {
      name: "Email",
      icon: Mail,
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
            className="flex items-center gap-2 border border-border-subtle px-3 py-2 font-label text-xs font-bold uppercase text-muted transition-all hover:bg-surface-elevated hover:text-foreground"
            title={platform.label}
          >
            <platform.icon className="h-3.5 w-3.5" />
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
            className="inline-flex items-center gap-2 ink-link text-muted transition-colors hover:text-primary"
          >
            <platform.icon className="h-3.5 w-3.5" />
            {platform.label}
          </a>
        ))}
        <CopyLinkButton url={url} />
      </div>
    </section>
  );
}
