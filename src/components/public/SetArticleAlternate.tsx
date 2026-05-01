"use client";

import { useEffect } from "react";
import { useArticleAlternate } from "@/contexts/ArticleAlternateContext";

interface Props {
  alternateHref: string | null;
}

/**
 * Drop this into an article page to inform the LanguageToggle of the correct
 * alternate-language URL. Without this, the toggle just swaps the locale
 * prefix while keeping the same slug — which gives a 404 when FR and EN
 * articles have different slugs.
 */
export default function SetArticleAlternate({ alternateHref }: Props) {
  const { setAlternateHref } = useArticleAlternate();

  useEffect(() => {
    setAlternateHref(alternateHref);
    // Clear when the article page unmounts (navigating away)
    return () => setAlternateHref(null);
  }, [alternateHref, setAlternateHref]);

  return null;
}
