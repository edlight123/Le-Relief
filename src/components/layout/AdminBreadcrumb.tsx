"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const pathLabels: Record<string, string> = {
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
  "/admin/analytics": "Analytiques",
  "/admin/editorial": "Rapport éditorial",
  "/admin/product": "Métriques produit",
};

function getLabelForPath(pathname: string): string | null {
  if (pathname in pathLabels) return pathLabels[pathname];

  // Match /admin/articles/[id]/edit
  const editMatch = pathname.match(/^\/admin\/articles\/([^/]+)\/edit$/);
  if (editMatch) return `Modifier l'article`;

  // Match /admin/articles/[id]
  const articleMatch = pathname.match(/^\/admin\/articles\/([^/]+)$/);
  if (articleMatch) return `Article`;

  // Match /admin/social/[articleId]
  const socialMatch = pathname.match(/^\/admin\/social\/([^/]+)$/);
  if (socialMatch) return `Réseau social — article`;

  // Match /admin/review/[articleId]
  const reviewMatch = pathname.match(/^\/admin\/review\/([^/]+)$/);
  if (reviewMatch) return `Review article`;

  return null;
}

export default function AdminBreadcrumb() {
  const pathname = usePathname();

  // Build breadcrumb trail by splitting path
  const segments = pathname.split("/").filter(Boolean);

  const crumbs: { label: string; href: string }[] = [];

  let accumulated = "";
  for (const segment of segments) {
    accumulated += "/" + segment;
    const label = getLabelForPath(accumulated);
    if (label) {
      crumbs.push({ label, href: accumulated });
    }
  }

  // Always have at least "Tableau de bord"
  if (crumbs.length === 0 || crumbs[0].href !== "/admin") {
    crumbs.unshift({ label: "Tableau de bord", href: "/admin" });
  }

  if (crumbs.length <= 1) return null; // No breadcrumb needed when at root

  return (
    <nav aria-label="Fil d'Ariane" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 font-label text-[11px] font-bold uppercase text-muted">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight className="h-3 w-3 text-border-subtle" aria-hidden="true" />
              )}
              {!isLast ? (
                <Link
                  href={crumb.href}
                  className="transition-colors hover:text-primary"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground" aria-current="page">
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}