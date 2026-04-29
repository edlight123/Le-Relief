"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { UserPen, Shield } from "lucide-react";

interface Author {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
  articleCount?: number;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  publisher: "Éditeur en chef",
  editor: "Éditeur",
  writer: "Rédacteur",
};

export default function AdminAuthorsPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        const allUsers: Author[] = data.users ?? [];
        const filtered = allUsers.filter(
          (u) => u.role === "admin" || u.role === "publisher" || u.role === "editor" || u.role === "writer",
        );
        setAuthors(filtered);
      } catch {
        setAuthors([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Administration"
        title="Auteurs"
        description="Membres de l'équipe éditoriale ayant un rôle rédactionnel."
      />

      <div className="flex flex-wrap items-center gap-3">
        <span className="font-label text-sm font-bold text-foreground">
          {loading ? "—" : authors.length} auteur{authors.length !== 1 ? "s" : ""}
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse border border-border-subtle bg-surface" />
          ))}
        </div>
      ) : authors.length === 0 ? (
        <EmptyState
          icon={UserPen}
          title="Aucun auteur"
          description="Aucun utilisateur avec un rôle rédactionnel trouvé."
          actionHref="/admin/users"
          actionLabel="Gérer les utilisateurs"
        />
      ) : (
        <div className="overflow-hidden border border-border-subtle bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-newsprint">
                <th className="px-4 py-3 text-left font-label text-[11px] font-extrabold uppercase tracking-wide text-muted">
                  Auteur
                </th>
                <th className="hidden px-4 py-3 text-left font-label text-[11px] font-extrabold uppercase tracking-wide text-muted md:table-cell">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-label text-[11px] font-extrabold uppercase tracking-wide text-muted">
                  Rôle
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {authors.map((author) => (
                <tr key={author.id} className="hover:bg-surface-newsprint">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {author.image ? (
                        <img
                          src={author.image}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-elevated">
                          <Shield className="h-4 w-4 text-muted" />
                        </div>
                      )}
                      <span className="font-body font-semibold text-foreground">
                        {author.name || "Sans nom"}
                      </span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 font-label text-xs text-muted md:table-cell">
                    {author.email || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="info">
                      {ROLE_LABELS[author.role || "writer"] || author.role || "Rédacteur"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-border-subtle px-4 py-3">
            <p className="font-label text-xs text-muted">
              {authors.length} auteur{authors.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
