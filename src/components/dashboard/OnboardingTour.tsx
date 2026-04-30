"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { normalizeAppRole } from "@/lib/role-routing";
import {
  X,
  ChevronRight,
  ChevronLeft,
  PenSquare,
  ClipboardCheck,
  Rocket,
  LayoutDashboard,
  Newspaper,
  BookOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface TourStep {
  icon: LucideIcon;
  title: string;
  description: string;
}

type AppRole = "writer" | "editor" | "publisher" | "admin";

const TOUR_STEPS: Record<AppRole, TourStep[]> = {
  writer: [
    {
      icon: BookOpen,
      title: "Bienvenue dans votre espace de rédaction",
      description:
        "Ici vous rédigez, sauvegardez vos brouillons et soumettez vos articles à relecture. Votre travail est sauvegardé automatiquement.",
    },
    {
      icon: PenSquare,
      title: "Créer un nouvel article",
      description:
        'Cliquez sur "Nouvel article" dans la barre latérale pour commencer. Remplissez le titre, le corps, l\'image de couverture et les métadonnées SEO avant de soumettre.',
    },
    {
      icon: Newspaper,
      title: "Suivre vos articles",
      description:
        'Retrouvez tous vos brouillons dans "Mes brouillons" et les articles renvoyés pour correction dans "Révisions demandées". Soumettez à relecture quand vous êtes prêt.',
    },
  ],
  editor: [
    {
      icon: BookOpen,
      title: "Bienvenue au desk éditorial",
      description:
        "Votre rôle est de relire, commenter, approuver ou demander des corrections sur les articles soumis par les rédacteurs.",
    },
    {
      icon: ClipboardCheck,
      title: "La file de relecture",
      description:
        'La "Review Queue" liste tous les articles en attente de relecture. Ouvrez un article pour le lire, laisser des commentaires internes, et prendre une décision éditoriale.',
    },
    {
      icon: PenSquare,
      title: "Approuver ou demander des révisions",
      description:
        "Une fois votre relecture faite, approuvez l'article pour qu'il passe en file de publication, ou demandez des corrections au rédacteur avec des commentaires précis.",
    },
  ],
  publisher: [
    {
      icon: BookOpen,
      title: "Bienvenue au desk publication",
      description:
        "Votre rôle est de publier les articles approuvés, de gérer le calendrier éditorial et de curate la page d'accueil.",
    },
    {
      icon: Rocket,
      title: "Publier un article",
      description:
        'Les articles approuvés apparaissent dans "Prêts à publier". Ouvrez un article, vérifiez les champs requis, puis cliquez sur "Publier maintenant" ou programmez une date.',
    },
    {
      icon: LayoutDashboard,
      title: "Gérer la une et le calendrier",
      description:
        'Depuis "Une", choisissez quels articles apparaissent en tête de page. Depuis "Programmés", gérez le calendrier de publication.',
    },
  ],
  admin: [
    {
      icon: BookOpen,
      title: "Bienvenue dans l'espace d'administration",
      description:
        "En tant qu'administrateur, vous avez accès à toutes les fonctions : rédaction, relecture, publication, gestion des utilisateurs et des paramètres.",
    },
    {
      icon: PenSquare,
      title: "Rédiger et publier",
      description:
        'Utilisez "Nouvel article" pour créer du contenu directement. En tant qu\'admin, vous pouvez publier sans passer par le cycle de relecture — mais celui-ci reste recommandé.',
    },
    {
      icon: ClipboardCheck,
      title: "Superviser le flux éditorial",
      description:
        'Le "Tableau de bord" vous donne une vue synthétique de tous les articles en cours. Utilisez Cmd+K (ou Ctrl+K) pour naviguer rapidement entre les sections.',
    },
    {
      icon: LayoutDashboard,
      title: "Gérer les utilisateurs et les paramètres",
      description:
        'Dans "Utilisateurs", invitez de nouveaux membres et assignez leurs rôles. Dans "Paramètres", configurez les règles de publication et les champs obligatoires.',
    },
  ],
};

const TOUR_KEY_PREFIX = "onboarding-tour-completed-";

export default function OnboardingTour() {
  const { data: session } = useSession();
  const rawRole = (session?.user as { role?: string } | undefined)?.role;
  const role = (normalizeAppRole(rawRole) ?? "writer") as AppRole;

  const tourKey = `${TOUR_KEY_PREFIX}${role}`;
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!session) return;
    const completed = localStorage.getItem(tourKey) === "true";
    if (!completed) setOpen(true);
  }, [session, tourKey]);

  const steps = TOUR_STEPS[role] ?? TOUR_STEPS.writer;
  const current = steps[step];
  const isFirst = step === 0;
  const isLast = step === steps.length - 1;

  const complete = useCallback(() => {
    localStorage.setItem(tourKey, "true");
    setOpen(false);
  }, [tourKey]);

  const next = useCallback(() => {
    if (isLast) complete();
    else setStep((s) => s + 1);
  }, [isLast, complete]);

  const prev = useCallback(() => setStep((s) => s - 1), []);

  if (!open || !current) return null;

  const Icon = current.icon;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Guide de démarrage"
    >
      <div className="relative w-full max-w-md bg-background border-t-4 border-primary shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
          <p className="font-label text-[10px] font-extrabold uppercase tracking-[1.4px] text-muted">
            Guide de démarrage · Étape {step + 1}/{steps.length}
          </p>
          <button
            onClick={complete}
            className="rounded-sm p-1 text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
            aria-label="Ignorer le guide"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center border border-border-subtle bg-surface-elevated">
            <Icon className="h-7 w-7 text-primary" />
          </div>
          <h2 className="font-headline text-xl font-extrabold leading-snug text-foreground">
            {current.title}
          </h2>
          <p className="mt-3 font-body text-sm leading-relaxed text-muted">
            {current.description}
          </p>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 pb-2">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-5 bg-primary" : "w-1.5 bg-border-strong"
              }`}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border-subtle px-6 py-4">
          <button
            onClick={prev}
            disabled={isFirst}
            className="flex items-center gap-1.5 font-label text-xs font-bold uppercase tracking-wide text-muted transition-colors hover:text-foreground disabled:invisible"
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </button>
          <button
            onClick={next}
            className="flex items-center gap-1.5 bg-primary px-5 py-2 font-label text-xs font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-primary/90"
          >
            {isLast ? "Commencer" : "Suivant"}
            {!isLast && <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
