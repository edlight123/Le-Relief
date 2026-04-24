import { FieldValue } from "firebase-admin/firestore";
import { getDb, serializeTimestamps } from "@/lib/firebase";
import type { HomepageSettings, HomepageSettingsInput } from "@/types/homepage";

const COLLECTION = "site_settings";
const HOMEPAGE_DOC_ID = "homepage";

export const DEFAULT_HOMEPAGE_SETTINGS: HomepageSettings = {
  id: HOMEPAGE_DOC_ID,
  heroArticleId: null,
  autoHero: true,
  secondaryArticleIds: [],
  highlightedCategoryIds: [],
  showNewsletter: true,
  showEnglishSelection: true,
};

function docRef() {
  return getDb().collection(COLLECTION).doc(HOMEPAGE_DOC_ID);
}

function normalizeIdList(value: unknown, limit: number) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value)]
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, limit);
}

function normalizeSettings(
  value: Record<string, unknown> | null,
): HomepageSettings {
  if (!value) return DEFAULT_HOMEPAGE_SETTINGS;

  return {
    ...DEFAULT_HOMEPAGE_SETTINGS,
    heroArticleId:
      typeof value.heroArticleId === "string" && value.heroArticleId.trim()
        ? value.heroArticleId.trim()
        : null,
    autoHero:
      typeof value.autoHero === "boolean"
        ? value.autoHero
        : DEFAULT_HOMEPAGE_SETTINGS.autoHero,
    secondaryArticleIds: normalizeIdList(value.secondaryArticleIds, 3),
    highlightedCategoryIds: normalizeIdList(value.highlightedCategoryIds, 12),
    showNewsletter:
      typeof value.showNewsletter === "boolean"
        ? value.showNewsletter
        : DEFAULT_HOMEPAGE_SETTINGS.showNewsletter,
    showEnglishSelection:
      typeof value.showEnglishSelection === "boolean"
        ? value.showEnglishSelection
        : DEFAULT_HOMEPAGE_SETTINGS.showEnglishSelection,
    updatedAt:
      typeof value.updatedAt === "string"
        ? value.updatedAt
        : DEFAULT_HOMEPAGE_SETTINGS.updatedAt,
  };
}

export async function getHomepageSettings() {
  const snap = await docRef().get();
  if (!snap.exists) return DEFAULT_HOMEPAGE_SETTINGS;

  const serialized = serializeTimestamps({
    id: snap.id,
    ...snap.data(),
  } as Record<string, unknown>);
  return normalizeSettings(serialized);
}

export async function updateHomepageSettings(input: HomepageSettingsInput) {
  const next = normalizeSettings(input as unknown as Record<string, unknown>);
  await docRef().set(
    {
      heroArticleId: next.heroArticleId,
      autoHero: next.autoHero,
      secondaryArticleIds: next.secondaryArticleIds,
      highlightedCategoryIds: next.highlightedCategoryIds,
      showNewsletter: next.showNewsletter,
      showEnglishSelection: next.showEnglishSelection,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return getHomepageSettings();
}
