"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  Home,
  FileText,
  PenSquare,
  Image as ImageIcon,
  BarChart3,
  Settings,
  Users,
  LogOut,
  X,
} from "lucide-react";
import { siteConfig } from "@/config/site.config";
import { signOut } from "next-auth/react";

const icons: Record<string, React.ReactNode> = {
  "/dashboard": <LayoutDashboard className="h-5 w-5" />,
  "/dashboard/homepage": <Home className="h-5 w-5" />,
  "/dashboard/articles": <FileText className="h-5 w-5" />,
  "/dashboard/articles/new": <PenSquare className="h-5 w-5" />,
  "/dashboard/media": <ImageIcon className="h-5 w-5" />,
  "/dashboard/analytics": <BarChart3 className="h-5 w-5" />,
  "/dashboard/settings": <Settings className="h-5 w-5" />,
  "/dashboard/users": <Users className="h-5 w-5" />,
};

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          "fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-border-strong bg-surface transition-transform lg:static lg:z-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border-strong px-6">
          <Link
            href="/dashboard"
            className="font-headline text-2xl font-extrabold text-foreground"
          >
            {siteConfig.name}
          </Link>
          <button
            onClick={onClose}
            className="border border-border-subtle p-1 transition-colors hover:bg-surface-elevated lg:hidden"
          >
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          {siteConfig.nav.dashboard.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  "flex items-center gap-3 border-b border-border-subtle py-3 font-label text-sm font-bold transition-colors",
                  active
                    ? "border-l-2 border-l-primary bg-surface-elevated pl-2 text-primary"
                    : "border-l-2 border-l-transparent pl-2 text-muted hover:bg-surface-newsprint hover:text-foreground"
                )}
              >
                {icons[item.href]}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border-strong px-4 py-4">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-3 px-1 py-2.5 font-label text-sm font-bold text-muted transition-colors hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
}
