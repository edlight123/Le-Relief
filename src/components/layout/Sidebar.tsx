"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { LogOut, X, ExternalLink } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { normalizeAppRole } from "@/lib/role-routing";
import { NAV_BY_ROLE, ROLE_LABEL } from "@/config/admin-nav.config";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const rawRole = (session?.user as { role?: string } | undefined)?.role;
  const role = normalizeAppRole(rawRole) ?? "writer";
  const userName = (session?.user as { name?: string } | undefined)?.name || "Rédaction";
  const roleLabel = ROLE_LABEL[role];
  const navGroups = NAV_BY_ROLE[role];

  /** Collect all nav item hrefs across all groups to detect parent-child overlaps. */
  const allItemHrefs = navGroups.flatMap((g) => g.items.map((it) => it.href));

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;

    // If a DIFFERENT nav item is a more specific match for the current path,
    // don't activate this parent item.
    const hasMoreSpecificItem = allItemHrefs.some(
      (other) =>
        other !== href &&
        other.startsWith(href + "/") &&
        (pathname === other || pathname.startsWith(other + "/")),
    );
    if (hasMoreSpecificItem) {
      return pathname === href;
    }

    if (pathname === href || pathname.startsWith(href + "/")) return true;

    return false;
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
          <Link href="/admin" className="flex items-center gap-2.5">
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

        {/* Role badge */}
        <div className="mx-3 mb-1 rounded-sm border border-border-subtle bg-surface-newsprint px-3 py-1.5">
          <p className="font-label text-[10px] font-extrabold uppercase tracking-widest text-muted/60">
            {roleLabel}
          </p>
          <p className="truncate font-label text-xs font-bold text-foreground">{userName}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="mb-1.5 px-2 font-label text-[10px] font-extrabold uppercase tracking-widest text-muted/50">
                {group.label}
              </p>
              {group.items.map((item) => {
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
                    <item.icon
                      className={clsx("h-4 w-4 shrink-0", active ? "text-primary" : "")}
                    />
                    <span className="flex-1">{item.label}</span>
                    {active && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="space-y-1 border-t border-border-subtle px-3 py-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2.5 rounded-sm px-2 py-2 font-label text-sm font-bold text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            Voir le site
          </Link>
          <button
            onClick={() => signOut({ redirectTo: "/" })}
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
