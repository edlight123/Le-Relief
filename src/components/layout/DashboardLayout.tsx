"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Command, Menu } from "lucide-react";
import RoleAwareSidebar from "@/components/layout/RoleAwareSidebar";
import ThemeToggle from "@/components/public/ThemeToggle";
import CommandPalette from "@/components/ui/CommandPalette";
import NotificationsPanel from "@/components/notifications/NotificationsPanel";
import AdminBreadcrumb from "@/components/layout/AdminBreadcrumb";
import OnboardingTip from "@/components/dashboard/OnboardingTip";
import OnboardingTour from "@/components/dashboard/OnboardingTour";

const sectionLabels: Record<string, string> = {
  // Legacy /dashboard routes
  "/dashboard": "Tableau de bord",
  "/dashboard/homepage": "Une",
  "/dashboard/articles": "Articles",
  "/dashboard/categories": "Rubriques",
  "/dashboard/my-drafts": "Mes brouillons",
  "/dashboard/articles/new": "Nouvel article",
  "/dashboard/review": "Review Queue",
  "/dashboard/revisions": "Révisions demandées",
  "/dashboard/approved": "File approuvée",
  "/dashboard/scheduled": "Programmés",
  "/dashboard/published": "Publiés",
  "/dashboard/media": "Médiathèque",
  "/dashboard/analytics": "Analytiques",
  "/dashboard/editorial": "Rapport éditorial",
  "/dashboard/product": "Métriques produit",
  "/dashboard/settings": "Paramètres",
  "/dashboard/users": "Utilisateurs",
  "/dashboard/authors": "Auteurs",
  // Canonical /admin routes
  "/admin/workspace": "Espace de travail",
  "/admin/articles/new": "Nouvel article",
  "/admin/drafts": "Mes brouillons",
  "/admin/revisions": "Révisions demandées",
  "/admin/submitted": "Soumis",
  "/admin/my-published": "Mes articles publiés",
  "/admin/review": "Review Queue",
  "/admin/review/attention": "Besoin d'attention",
  "/admin/review/approved": "Approuvés",
  "/admin/publishing": "Tableau de publication",
  "/admin/publishing/ready": "Prêts à publier",
  "/admin/publishing/scheduled": "Programmés",
  "/admin/publishing/published": "Publiés",
  "/admin/publishing/priority": "Priorité & breaking",
  "/admin/homepage": "Une",
  "/admin/articles": "Articles",
  "/admin/dashboard": "Tableau de bord",
  "/admin/users": "Utilisateurs",
  "/admin/authors": "Auteurs",
  "/admin/sections": "Rubriques",
  "/admin/media": "Médiathèque",
  "/admin/social": "Réseaux sociaux",
  "/admin/settings": "Paramètres",
  "/admin/audit": "Journal d'audit",
};

function getSectionLabel(pathname: string) {
  if (pathname.includes("/edit")) return "Modifier l'article";
  if (pathname.includes("/review") && pathname.includes("/articles/")) return "Review article";
  return sectionLabels[pathname] ?? "Tableau de bord";
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const pathname = usePathname();
  const label = getSectionLabel(pathname);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen bg-surface-newsprint">
      <RoleAwareSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border-subtle bg-surface px-5">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-sm p-1.5 text-muted transition-colors hover:bg-surface-elevated hover:text-foreground lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-label text-xs font-bold uppercase tracking-wider text-muted">
            {label}
          </span>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden items-center gap-1.5 border border-border-subtle px-2.5 py-1.5 font-mono text-[10px] uppercase text-muted transition-colors hover:border-border-strong hover:text-foreground sm:flex"
              aria-label="Ouvrir la palette de commandes"
            >
              <Command className="h-3 w-3" />
              <span>K</span>
            </button>
            <ThemeToggle />
            <NotificationsPanel />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          <AdminBreadcrumb />
          <OnboardingTour />
          <OnboardingTip />
          <div className="mt-4" />
          {children}
        </main>
      </div>
    </div>
  );
}
