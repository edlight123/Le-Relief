"use client";

import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";
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

  const roleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "danger" as const;
      case "publisher":
        return "info" as const;
      default:
        return "default" as const;
    }
  };

  return (
    <div className="space-y-6">
      <header className="border-t-2 border-border-strong pt-4">
        <p className="page-kicker mb-2">Accès</p>
        <h1 className="font-headline text-5xl font-extrabold leading-none text-foreground">
          Utilisateurs
        </h1>
      </header>

      <div className="overflow-hidden border border-border-subtle bg-surface">
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
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center font-body text-muted"
                >
                  Aucun utilisateur trouvé
                </td>
              </tr>
            ) : (
              users.map((user) => (
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
                    <Badge variant={roleBadgeVariant(user.role)}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="hidden px-4 py-3 font-label text-muted lg:table-cell">
                    {format(new Date(user.createdAt), "d MMM yyyy", { locale: fr })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(user.id, e.target.value)
                      }
                      className="border border-border-subtle bg-surface px-2 py-1 font-label text-sm text-foreground focus:outline-none"
                    >
                      <option value="reader">Lecteur</option>
                      <option value="publisher">Éditeur</option>
                      <option value="admin">Admin</option>
                    </select>
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
