"use client";

import { useEffect, useRef, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { Users, Shield, KeyRound, Pencil, Check, X, UserPlus, Trash2 } from "lucide-react";

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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetStatus, setResetStatus] = useState<Record<string, "idle" | "loading" | "sent" | "error">>({});
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [roleChanging, setRoleChanging] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Add user modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", password: "", role: "reader" });
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  async function handleRoleChange(user: User, newRole: string) {
    if (newRole === user.role) return;
    setRoleChanging((prev) => ({ ...prev, [user.id]: true }));
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: updated.role } : u)));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? "Erreur lors du changement de rôle");
      }
    } catch {
      alert("Erreur réseau");
    } finally {
      setRoleChanging((prev) => ({ ...prev, [user.id]: false }));
    }
  }

  function startEditEmail(user: User) {
    setEditingEmail(user.id);
    setEmailDraft(user.email ?? "");
    setTimeout(() => emailInputRef.current?.focus(), 0);
  }

  function cancelEditEmail() {
    setEditingEmail(null);
    setEmailDraft("");
  }

  async function saveEmail(user: User) {
    const trimmed = emailDraft.trim().toLowerCase();
    if (!trimmed || trimmed === (user.email ?? "").toLowerCase()) {
      cancelEditEmail();
      return;
    }
    setEmailSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, email: updated.email } : u)));
        cancelEditEmail();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? "Erreur lors de la mise à jour");
      }
    } catch {
      alert("Erreur réseau");
    } finally {
      setEmailSaving(false);
    }
  }

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

  async function handleDelete(userId: string) {
    setConfirmDeleteId(null);
    setDeleting((prev) => ({ ...prev, [userId]: true }));
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? "Erreur lors de la suppression");
      }
    } catch {
      alert("Erreur réseau");
    } finally {
      setDeleting((prev) => ({ ...prev, [userId]: false }));
    }
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    setAddSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      if (res.ok) {
        const newUser = await res.json();
        setUsers((prev) => [newUser, ...prev]);
        setShowAddModal(false);
        setAddForm({ name: "", email: "", password: "", role: "reader" });
      } else {
        const err = await res.json().catch(() => ({}));
        setAddError(err.error ?? "Erreur lors de la création");
      }
    } catch {
      setAddError("Erreur réseau");
    } finally {
      setAddSaving(false);
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
        <button
          type="button"
          onClick={() => { setShowAddModal(true); setAddError(null); }}
          className="ml-auto flex items-center gap-1.5 rounded-sm bg-primary px-3 py-1.5 font-label text-xs font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-primary/90"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Ajouter
        </button>
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
                    {editingEmail === user.id ? (
                      <form
                        className="flex items-center gap-1"
                        onSubmit={(e) => { e.preventDefault(); saveEmail(user); }}
                      >
                        <input
                          ref={emailInputRef}
                          type="email"
                          value={emailDraft}
                          onChange={(e) => setEmailDraft(e.target.value)}
                          disabled={emailSaving}
                          className="w-56 rounded border border-border-subtle bg-surface px-2 py-0.5 font-label text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                        />
                        <button
                          type="submit"
                          disabled={emailSaving}
                          className="text-success hover:text-foreground disabled:opacity-50"
                          title="Enregistrer"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditEmail}
                          disabled={emailSaving}
                          className="text-muted hover:text-foreground disabled:opacity-50"
                          title="Annuler"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditEmail(user)}
                        className="group flex items-center gap-1.5 hover:text-foreground"
                        title="Modifier l'adresse courriel"
                      >
                        <span>{user.email || "—"}</span>
                        <Pencil className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role || "reader"}
                      disabled={roleChanging[user.id]}
                      onChange={(e) => handleRoleChange(user, e.target.value)}
                      className="rounded border border-border-subtle bg-surface px-2 py-0.5 font-label text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                      title="Changer le rôle"
                    >
                      {Object.entries(ROLE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
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
                    <button
                      type="button"
                      disabled={deleting[user.id]}
                      onClick={() => setConfirmDeleteId(user.id)}
                      className="flex items-center gap-1 font-label text-xs font-bold text-muted transition-colors hover:text-primary disabled:opacity-50"
                      title="Supprimer cet utilisateur"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    </div>
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

      {/* Delete confirmation modal */}
      {confirmDeleteId && (() => {
        const target = users.find((u) => u.id === confirmDeleteId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-sm border border-border-subtle bg-surface shadow-xl">
              <div className="border-b border-border-subtle px-5 py-4">
                <h2 className="font-headline text-base font-extrabold text-foreground">Confirmer la suppression</h2>
              </div>
              <div className="space-y-3 px-5 py-4">
                <p className="font-body text-sm text-foreground">
                  Supprimer définitivement l&apos;utilisateur{" "}
                  <span className="font-semibold">{target?.name || target?.email || confirmDeleteId}</span>
                  {" "}? Cette action est irréversible.
                </p>
                {target?.email && (
                  <p className="font-label text-xs text-muted">{target.email}</p>
                )}
              </div>
              <div className="flex justify-end gap-2 border-t border-border-subtle px-5 py-3">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="rounded-sm border border-border-subtle px-4 py-1.5 font-label text-xs font-bold text-muted transition-colors hover:text-foreground"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={deleting[confirmDeleteId]}
                  onClick={() => handleDelete(confirmDeleteId)}
                  className="rounded-sm bg-primary px-4 py-1.5 font-label text-xs font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {deleting[confirmDeleteId] ? "Suppression..." : "Supprimer"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-sm border border-border-subtle bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
              <h2 className="font-headline text-base font-extrabold text-foreground">Ajouter un utilisateur</h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-4 px-5 py-4">
              {addError && (
                <p className="rounded border border-primary/20 bg-primary/5 px-3 py-2 font-label text-xs text-primary">
                  {addError}
                </p>
              )}
              <div>
                <label className="mb-1 block font-label text-xs font-bold text-muted">Nom complet</label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded border border-border-subtle bg-surface px-3 py-1.5 font-body text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1 block font-label text-xs font-bold text-muted">Courriel</label>
                <input
                  type="email"
                  required
                  value={addForm.email}
                  onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded border border-border-subtle bg-surface px-3 py-1.5 font-body text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1 block font-label text-xs font-bold text-muted">Mot de passe</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={addForm.password}
                  onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full rounded border border-border-subtle bg-surface px-3 py-1.5 font-body text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1 block font-label text-xs font-bold text-muted">Rôle</label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full rounded border border-border-subtle bg-surface px-3 py-1.5 font-body text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-sm border border-border-subtle px-4 py-1.5 font-label text-xs font-bold text-muted transition-colors hover:text-foreground"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={addSaving}
                  className="rounded-sm bg-primary px-4 py-1.5 font-label text-xs font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {addSaving ? "Création..." : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
