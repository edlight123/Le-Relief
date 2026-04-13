"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  FileText,
  PenSquare,
  Image,
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
  "/dashboard/articles": <FileText className="h-5 w-5" />,
  "/dashboard/articles/new": <PenSquare className="h-5 w-5" />,
  "/dashboard/media": <Image className="h-5 w-5" />,
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
          "fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 flex flex-col transition-transform lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-neutral-200 dark:border-neutral-800">
          <Link
            href="/dashboard"
            className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white"
          >
            {siteConfig.name}
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="h-5 w-5 text-neutral-500" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {siteConfig.nav.dashboard.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-white"
                )}
              >
                {icons[item.href]}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-white transition-colors w-full"
          >
            <LogOut className="h-5 w-5" />
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
}
