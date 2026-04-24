export interface HomepageSettings {
  id: "homepage";
  heroArticleId: string | null;
  autoHero: boolean;
  secondaryArticleIds: string[];
  highlightedCategoryIds: string[];
  showNewsletter: boolean;
  showEnglishSelection: boolean;
  updatedAt?: string;
}

export type HomepageSettingsInput = Omit<HomepageSettings, "id" | "updatedAt">;
