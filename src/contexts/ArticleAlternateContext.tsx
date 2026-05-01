"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface ArticleAlternateContextValue {
  alternateHref: string | null;
  setAlternateHref: (href: string | null) => void;
}

const ArticleAlternateContext = createContext<ArticleAlternateContextValue>({
  alternateHref: null,
  setAlternateHref: () => {},
});

export function ArticleAlternateProvider({ children }: { children: ReactNode }) {
  const [alternateHref, setAlternateHrefState] = useState<string | null>(null);

  const setAlternateHref = useCallback((href: string | null) => {
    setAlternateHrefState(href);
  }, []);

  return (
    <ArticleAlternateContext.Provider value={{ alternateHref, setAlternateHref }}>
      {children}
    </ArticleAlternateContext.Provider>
  );
}

export function useArticleAlternate() {
  return useContext(ArticleAlternateContext);
}
