"use client";

import { useState, useEffect } from "react";
import { Search, Users } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import FilterBar, { FilterBarSection } from "@/components/ui/FilterBar";
import EmptyState from "@/components/ui/EmptyState";
import UserRoleBadge from "@/components/ui/UserRoleBadge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sendingLinkFor, setSendingLinkFor] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => setUsers(data.users || []))
      .finally(() => setLoading(false));
  }, []);

  async function handleRoleChange(userId: string, role: string) {
    await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role } : u))
    );
  }

  async function handleSendSetupLink(userId: string) {
    setStatusMessage("");
    setSendingLinkFor(userId);

    try {
      const res = await fetch(`/api/users/${userId}/setup-link`, {
        method: "POST",
      });

      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        setStatusMessage(payload.error || "Impossible d'envoyer le lien");
      } else {
        setStatusMessage("Lien d'activation envoyé.");
      }
    } catch {
      setStatusMessage("Une erreur est survenue lors de l'envoi.");
    } finally {
      setSendingLinkFor(null);
    }
  }

  const filteredUsers = users.filter((user) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (user.name || "").toLowerCase().includes(term) || user.email.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Accès"
        title="Utilisateurs"
        description="Gestion simple des rôles, accès newsroom et administration des profils backoffice."
      />

      <FilterBar>
        <FilterBarSection className="min-w-0 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              placeholder="Rechercher un utilisateur…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-sm border border-border-subtle bg-surface py-2 pl-9 pr-4 font-label text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>
        </FilterBarSection>
        <FilterBarSection>
          <span className="font-label text-xs uppercase text-muted">
            {loading ? "—" : filteredUsers.length} utilisateur{filteredUsers.length > 1 ? "s" : ""}
          </span>
        </FilterBarSection>
      </FilterBar>

      <div className="overflow-hidden border border-border-subtle bg-surface">
        {statusMessage && (
          <p className="border-b border-border-subtle px-4 py-3 font-label text-sm text-foreground">
            {statusMessage}
          </p>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-strong bg-surface-newsprint">
              <th className="px-4 py-3 text-left font-label text-xs font-extrabold uppercase text-muted">
                Utilisateur
              </th>
              <th className="hidden px-4 py-3 text-left font-label text-xs font-extrabold uppercase text-muted md:table-cell">
                Courriel
              </th>
              <th className="px-4 py-3 text-left font-label text-xs font-extrabold uppercase text-muted">
                Rôle
              </th>
              <th className="hidden px-4 py-3 text-left font-label text-xs font-extrabold uppercase text-muted lg:table-cell">
                Création
              </th>
              <th className="px-4 py-3 text-right font-label text-xs font-extrabold uppercase text-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center font-body text-muted"
                >
                  Chargement...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8">
                  <EmptyState
                    icon={Users}
                    title="Aucun utilisateur trouvé"
                    description="Essayez une autre recherche ou ajoutez un membre via votre flux d’authentification."
                  />
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-surface-newsprint"
                >
                  <td className="px-4 py-3 font-headline text-lg font-bold text-foreground">
                    {user.name || "Sans nom"}
                  </td>
                  <td className="hidden px-4 py-3 font-label text-muted md:table-cell">
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    <UserRoleBadge role={user.role} />
                  </td>
                  <td className="hidden px-4 py-3 font-label text-muted lg:table-cell">
                    {format(new Date(user.createdAt), "d MMM yyyy", { locale: fr })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleSendSetupLink(user.id)}
                        disabled={sendingLinkFor === user.id}
                        className="border border-border-subtle bg-surface px-3 py-2 font-label text-xs font-bold uppercase tracking-wide text-foreground transition-colors hover:bg-surface-newsprint disabled:opacity-50"
                      >
                        {sendingLinkFor === user.id ? "Envoi..." : "Envoyer lien"}
                      </button>

                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(user.id, e.target.value)
                        }
                        className="border border-border-subtle bg-surface px-3 py-2 font-label text-sm text-foreground focus:border-primary focus:outline-none"
                      >
                        <option value="reader">Lecteur (legacy)</option>
                        <option value="writer">Rédacteur</option>
                        <option value="editor">Éditeur</option>
                        <option value="publisher">Publisher</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
