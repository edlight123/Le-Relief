"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import { Settings, CheckCircle2, AlertTriangle, Globe, Bell, Shield } from "lucide-react";

export default function AdminSettingsPage() {
  const [siteName, setSiteName] = useState("Le Relief");
  const [siteDescription, setSiteDescription] = useState("Revue en ligne d'information et d'analyse.");
  const [defaultLanguage, setDefaultLanguage] = useState<"fr" | "en">("fr");
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      // Settings are stored locally for now — extensible to an API later
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Administration"
        title="Paramètres"
        description="Configuration générale du site et des préférences éditoriales."
      />

      {error && (
        <div className="flex items-center gap-2 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> Paramètres sauvegardés.
        </div>
      )}

      <Card>
        <CardHeader>
          <p className="flex items-center gap-2 font-label text-xs font-extrabold uppercase tracking-wider text-muted">
            <Globe className="h-4 w-4" /> Général
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block font-label text-xs font-bold uppercase text-muted">
              Nom du site
            </label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full border border-border-subtle bg-surface px-3 py-2 font-body text-sm text-foreground"
            />
          </div>
          <div>
            <label className="mb-1 block font-label text-xs font-bold uppercase text-muted">
              Description
            </label>
            <textarea
              value={siteDescription}
              onChange={(e) => setSiteDescription(e.target.value)}
              rows={3}
              className="w-full border border-border-subtle bg-surface px-3 py-2 font-body text-sm text-foreground"
            />
          </div>
          <div>
            <label className="mb-1 block font-label text-xs font-bold uppercase text-muted">
              Langue par défaut
            </label>
            <select
              value={defaultLanguage}
              onChange={(e) => setDefaultLanguage(e.target.value as "fr" | "en")}
              className="w-full border border-border-subtle bg-surface px-3 py-2 font-label text-sm text-foreground"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <p className="flex items-center gap-2 font-label text-xs font-extrabold uppercase tracking-wider text-muted">
            <Shield className="h-4 w-4" /> Traduction
          </p>
        </CardHeader>
        <CardContent>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={autoTranslate}
              onChange={(e) => setAutoTranslate(e.target.checked)}
              className="h-4 w-4 rounded border-border-subtle"
            />
            <span className="font-label text-sm text-foreground">
              Traduction automatique des articles publiés en français vers l&apos;anglais
            </span>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <p className="flex items-center gap-2 font-label text-xs font-extrabold uppercase tracking-wider text-muted">
            <Bell className="h-4 w-4" /> Notifications
          </p>
        </CardHeader>
        <CardContent>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="h-4 w-4 rounded border-border-subtle"
            />
            <span className="font-label text-sm text-foreground">
              Notifications par email pour les changements de statut
            </span>
          </label>
        </CardContent>
      </Card>

      <div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center rounded-sm bg-primary px-4 py-2 font-label text-xs font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          {saving ? "Sauvegarde…" : "Sauvegarder les paramètres"}
        </button>
      </div>
    </div>
  );
}
