"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { Users, Shield, KeyRound } from "lucide-react";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
  createdAt?: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  publisher: "Éditeur en chef",
  editor: "Éditeur",
  writer: "Rédacteur",
  reader: "Lecteur",
};

const ROLE_VARIANTS: Record<string, "default" | "info" | "success" | "warning" | "danger"> = {
  admin: "danger",
  publisher: "warning",
  editor: "info",
  writer: "success",
  reader: "default",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetStatus, setResetStatus] = useState<Record<string, "idle" | "loading" | "sent" | "error">>({});

  async function handleSendResetLink(user: User) {
    if (!user.email) return;
    setResetStatus((prev) => ({ ...prev, [user.id]: "loading" }));
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      setResetStatus((prev) => ({ ...prev, [user.id]: res.ok ? "sent" : "error" }));
    } catch {
      setResetStatus((prev) => ({ ...prev, [user.id]: "error" }));
    }
  }

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => setUsers(data.users ?? []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Administration"
        title="Utilisateurs"
        description="Gestion des comptes et des rôles de l'équipe éditoriale."
      />

      <div className="flex flex-wrap items-center gap-3">
        <span className="font-label text-sm font-bold text-foreground">
          {loading ? "—" : users.length} utilisateur{users.length !== 1 ? "s" : ""}
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse border border-border-subtle bg-surface" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun utilisateur"
          description="Aucun utilisateur trouvé."
          actionHref="/admin/settings"
          actionLabel="Paramètres"
        />
      ) : (
        <div className="overflow-hidden border border-border-subtle bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-newsprint">
                <th className="px-4 py-3 text-left font-label text-[11px] font-extrabold uppercase tracking-wide text-muted">
                  Nom
                </th>
                <th className="hidden px-4 py-3 text-left font-label text-[11px] font-extrabold uppercase tracking-wide text-muted md:table-cell">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-label text-[11px] font-extrabold uppercase tracking-wide text-muted">
                  Rôle
                </th>
                <th className="px-4 py-3 text-right font-label text-[11px] font-extrabold uppercase tracking-wide text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-surface-newsprint">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-elevated">
                          <Shield className="h-4 w-4 text-muted" />
                        </div>
                      )}
                      <span className="font-body font-semibold text-foreground">
                        {user.name || "Sans nom"}
                      </span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 font-label text-xs text-muted md:table-cell">
                    {user.email || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={ROLE_VARIANTS[user.role || "reader"] || "default"}>
                      {ROLE_LABELS[user.role || "reader"] || user.role || "Lecteur"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {resetStatus[user.id] === "sent" ? (
                      <span className="font-label text-xs text-muted">Lien envoyé ✓</span>
                    ) : resetStatus[user.id] === "error" ? (
                      <span className="font-label text-xs text-primary">Erreur</span>
                    ) : (
                      <button
                        type="button"
                        disabled={resetStatus[user.id] === "loading"}
                        onClick={() => handleSendResetLink(user)}
                        className="flex items-center gap-1.5 font-label text-xs font-bold text-muted transition-colors hover:text-foreground disabled:opacity-50"
                        title="Envoyer un lien de réinitialisation"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                        {resetStatus[user.id] === "loading" ? "Envoi..." : "Réinitialiser"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-border-subtle px-4 py-3">
            <p className="font-label text-xs text-muted">
              {users.length} utilisateur{users.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
