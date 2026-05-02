"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import type { Locale } from "@/lib/locale";

const SHOW_AFTER_PX = 600;

export default function BackToTop({ locale = "fr" }: { locale?: Locale }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function update() {
      setVisible(window.scrollY > SHOW_AFTER_PX);
    }
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  function handleClick() {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }

  const label = locale === "fr" ? "Retour en haut" : "Back to top";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      title={label}
      className={`fixed right-4 z-40 flex h-11 w-11 items-center justify-center border border-border-strong bg-background text-foreground shadow-md transition-all duration-200 hover:border-primary hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary md:right-6 ${
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      } bottom-20 md:bottom-6`}
    >
      <ArrowUp className="h-5 w-5" strokeWidth={2} />
    </button>
  );
}
