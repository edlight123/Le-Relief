"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const ROUTES = [
  { label: "Tableau de bord", path: "/dashboard", hint: "T" },
  { label: "Nouvel article", path: "/dashboard/articles/new", hint: "N" },
  { label: "Tous les articles", path: "/dashboard/articles", hint: "A" },
  { label: "Rubriques", path: "/dashboard/categories", hint: "C" },
  { label: "Mes brouillons", path: "/dashboard/my-drafts", hint: "D" },
  { label: "Review Queue", path: "/dashboard/review", hint: "R" },
  { label: "Révisions demandées", path: "/dashboard/revisions", hint: "V" },
  { label: "Approuvés", path: "/dashboard/approved", hint: "Q" },
  { label: "Programmés", path: "/dashboard/scheduled", hint: "G" },
  { label: "Publiés", path: "/dashboard/published", hint: "L" },
  { label: "Auteurs", path: "/dashboard/authors", hint: "O" },
  { label: "Analytiques", path: "/dashboard/analytics", hint: "S" },
  { label: "Médiathèque", path: "/dashboard/media", hint: "M" },
  { label: "Utilisateurs", path: "/dashboard/users", hint: "U" },
  { label: "Paramètres", path: "/dashboard/settings", hint: "P" },
  { label: "Une (Homepage)", path: "/dashboard/homepage", hint: "H" },
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = ROUTES.filter((r) =>
    r.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  const safeSelectedIndex =
    filtered.length === 0 ? -1 : Math.min(selectedIndex, filtered.length - 1);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        if (filtered.length === 0) return;
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        if (filtered.length === 0) return;
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const route = safeSelectedIndex >= 0 ? filtered[safeSelectedIndex] : null;
        if (route) {
          router.push(route.path);
          onClose();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, filtered, safeSelectedIndex, router, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[15vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-none border border-border-subtle bg-surface animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher..."
            className="w-full bg-transparent font-label text-sm text-foreground placeholder:text-muted focus:outline-none"
            autoFocus
          />
        </div>

        <ul>
          {filtered.map((route, index) => (
            <li key={route.path}>
              <button
                className={`flex w-full items-center justify-between px-4 py-2.5 transition-colors hover:bg-surface-newsprint${
                  index === safeSelectedIndex ? " bg-surface-newsprint" : ""
                }`}
                onClick={() => {
                  router.push(route.path);
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className="font-label text-sm font-bold text-foreground">
                  {route.label}
                </span>
                <span className="font-mono text-[10px] uppercase text-muted">
                  {route.hint}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="border-t border-border-subtle px-4 py-2 font-mono text-[10px] uppercase text-muted">
          ↑↓ naviguer · ↵ sélectionner · esc fermer
        </div>
      </div>
    </div>
  );
}
