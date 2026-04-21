"use client";

import { useState } from "react";
import { useLocaleContext } from "@/hooks/useLocaleContext";
import { t } from "@/lib/i18n";

export default function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const locale = useLocaleContext();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for browsers that block clipboard without HTTPS
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="ink-link text-left font-label text-xs font-bold uppercase text-muted transition-colors hover:text-primary"
    >
      {copied ? t(locale, "copied") : t(locale, "copyLink")}
    </button>
  );
}
