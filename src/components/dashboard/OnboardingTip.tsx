"use client";

import { useAuth } from "@/hooks/useAuth";
import { adminUiTokens } from "@/config/admin-ui.tokens";
import { clsx } from "clsx";
import { startTransition, useState, useCallback, useEffect } from "react";
import { X } from "lucide-react";

interface RoleTip {
  role: string;
  key: string;
  title: string;
  message: string;
}

const roleTips: RoleTip[] = [
  {
    role: "editor",
    key: "editor-first-article",
    title: "Premier pas",
    message:
      "Commencez par créer ou réviser un article dans la file d'attente éditoriale. Vous pouvez filtrer par statut pour trouver les brouillons à relire.",
  },
  {
    role: "author",
    key: "author-first-draft",
    title: "Votre espace de rédaction",
    message:
      "Rédigez votre premier brouillon depuis la page Articles. Une fois prêt, soumettez-le pour relecture.",
  },
  {
    role: "admin",
    key: "admin-overview",
    title: "Tableau de bord",
    message:
      "Utilisez la palette de commandes (Cmd+K) pour naviguer rapidement entre les sections. Surveillez les indicateurs de santé du contenu.",
  },
  {
    role: "translator",
    key: "translator-queue",
    title: "File de traduction",
    message:
      "Les articles prêts à traduire apparaissent dans votre file dédiée. Utilisez le glossaire pour garantir la cohérence terminologique.",
  },
];

const STORAGE_PREFIX = "onboarding-dismissed-";

export default function OnboardingTip() {
  const { user } = useAuth();
  const role = user?.role ?? "reader";
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = new Set<string>();
    for (const tip of roleTips) {
      if (localStorage.getItem(`${STORAGE_PREFIX}${tip.key}`) === "true") {
        stored.add(tip.key);
      }
    }
    startTransition(() => setDismissedKeys(stored));
  }, []);

  const relevantTip = roleTips.find(
    (tip) => tip.role === role && !dismissedKeys.has(tip.key)
  );

  const dismiss = useCallback(
    (key: string) => {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, "true");
      setDismissedKeys((prev) => new Set([...prev, key]));
    },
    []
  );

  if (!relevantTip) {
    return null;
  }

  return (
    <div
      className={clsx(
        "relative rounded-md px-4 py-3 pr-10",
        adminUiTokens.onboarding.tipBg
      )}
      role="status"
      aria-label={`Astuce : ${relevantTip.title}`}
    >
      <p className={adminUiTokens.onboarding.tipTitle}>{relevantTip.title}</p>
      <p className={clsx(adminUiTokens.onboarding.tipText, "mt-1")}>
        {relevantTip.message}
      </p>
      <button
        type="button"
        onClick={() => dismiss(relevantTip.key)}
        className="absolute right-2 top-2 rounded-full p-1 text-blue-500 hover:bg-blue-200 dark:hover:bg-blue-800"
        aria-label="Ignorer cette astuce"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}