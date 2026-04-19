"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import ThemeToggle from "@/components/public/ThemeToggle";

const sectionLabels: Record<string, string> = {
  "/dashboard": "Tableau de bord",
  "/dashboard/homepage": "Une",
  "/dashboard/articles": "Articles",
  "/dashboard/articles/new": "Nouvel article",
  "/dashboard/media": "Médiathèque",
  "/dashboard/analytics": "Analytiques",
  "/dashboard/settings": "Paramètres",
  "/dashboard/users": "Utilisateurs",
};

function getSectionLabel(pathname: string) {
  if (pathname.includes("/edit")) return "Modifier l'article";
  return sectionLabels[pathname] ?? "Tableau de bord";
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const label = getSectionLabel(pathname);

  return (
    <div className="flex h-screen bg-surface-newsprint">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
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
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
