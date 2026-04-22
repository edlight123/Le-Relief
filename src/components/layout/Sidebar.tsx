"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  Home,
  FileText,
  PenSquare,
  ClipboardCheck,
  RotateCcw,
  CalendarClock,
  CheckCircle2,
  Image as ImageIcon,
  BarChart3,
  Settings,
  Users,
  LogOut,
  X,
  ExternalLink,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { normalizeWorkflowRole } from "@/lib/editorial-workflow";

const navGroups = [
  {
    label: "Édition",
    items: [
      { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard, exact: true },
      { label: "Une", href: "/dashboard/homepage", icon: Home },
      { label: "Articles", href: "/dashboard/articles", icon: FileText },
      { label: "Mes brouillons", href: "/dashboard/my-drafts", icon: PenSquare },
      { label: "Nouvel article", href: "/dashboard/articles/new", icon: PenSquare },
      { label: "Review Queue", href: "/dashboard/review", icon: ClipboardCheck },
      { label: "Révisions", href: "/dashboard/revisions", icon: RotateCcw },
      { label: "Approuvés", href: "/dashboard/approved", icon: CheckCircle2 },
      { label: "Programmés", href: "/dashboard/scheduled", icon: CalendarClock },
      { label: "Publiés", href: "/dashboard/published", icon: CheckCircle2 },
    ],
  },
  {
    label: "Médias",
    items: [
      { label: "Médiathèque", href: "/dashboard/media", icon: ImageIcon },
    ],
  },
  {
    label: "Analyse",
    items: [
      { label: "Analytiques", href: "/dashboard/analytics", icon: BarChart3 },
      { label: "Rapport éditorial", href: "/dashboard/editorial", icon: BarChart3 },
      { label: "Métriques produit", href: "/dashboard/product", icon: BarChart3 },
    ],
  },
  {
    label: "Configuration",
    items: [
      { label: "Paramètres", href: "/dashboard/settings", icon: Settings },
      { label: "Utilisateurs", href: "/dashboard/users", icon: Users },
    ],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = normalizeWorkflowRole((session?.user as { role?: string } | undefined)?.role || "writer");

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;
    if (href === "/dashboard/articles" && pathname.startsWith("/dashboard/articles/new")) return false;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          "fixed left-0 top-0 z-50 flex h-full w-60 flex-col bg-surface transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0",
          "border-r border-border-subtle",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Le Relief"
              width={28}
              height={28}
                            sizes="28px"
              className="h-7 w-7 rounded-sm"
            />
            <span className="font-headline text-base font-extrabold tracking-tight text-foreground">
              Le Relief
            </span>
          </Link>
          <button
            onClick={onClose}
            className="p-1 text-muted transition-colors hover:text-foreground lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="mb-1.5 px-2 font-label text-[10px] font-extrabold uppercase tracking-widest text-muted/50">
                {group.label}
              </p>
              {group.items.map((item) => {
                if (item.href === "/dashboard/users" && role !== "admin") return null;
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={clsx(
                      "mb-0.5 flex items-center gap-2.5 rounded-sm px-2 py-2 font-label text-sm font-bold transition-all duration-150",
                      active
                        ? "bg-primary/[0.08] text-primary"
                        : "text-muted hover:bg-surface-elevated hover:text-foreground",
                    )}
                  >
                    <item.icon className={clsx("h-4 w-4 shrink-0", active ? "text-primary" : "")} />
                    <span className="flex-1">{item.label}</span>
                    {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-border-subtle px-3 py-3 space-y-0.5">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2.5 rounded-sm px-2 py-2 font-label text-sm font-bold text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            Voir le site
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-2.5 rounded-sm px-2 py-2 font-label text-sm font-bold text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
}
