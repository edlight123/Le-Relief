"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/ui/PageHeader";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import { CheckCircle2, AlertTriangle, Globe, Bell, Shield, Send } from "lucide-react";

export default function AdminSettingsPage() {
  const [siteName, setSiteName] = useState("Le Relief");
  const [siteDescription, setSiteDescription] = useState("Revue en ligne d'information et d'analyse.");
  const [defaultLanguage, setDefaultLanguage] = useState<"fr" | "en">("fr");
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Push broadcast state
  const [pushTitle, setPushTitle] = useState("");
  const [pushBody, setPushBody] = useState("");
  const [pushUrl, setPushUrl] = useState("/");
  const [pushLocale, setPushLocale] = useState<"" | "fr" | "en">("");
  const [pushSending, setPushSending] = useState(false);
  const [pushResult, setPushResult] = useState<{ sent?: number; failed?: number; expired?: number; total?: number; error?: string } | null>(null);
  const [pushSubscribers, setPushSubscribers] = useState<{ total: number; byLocale: Record<string, number> } | null>(null);
  const [pushSubscribersLoading, setPushSubscribersLoading] = useState(false);

  async function loadSubscribers() {
    setPushSubscribersLoading(true);
    try {
      const res = await fetch("/api/push/subscribe");
      if (res.ok) setPushSubscribers(await res.json() as { total: number; byLocale: Record<string, number> });
    } finally {
      setPushSubscribersLoading(false);
    }
  }

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

  // Load subscriber count on mount — intentionally async so setState is
  // never called synchronously inside the effect body.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/push/subscribe")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { total: number; byLocale: Record<string, number> } | null) => {
        if (!cancelled && data) setPushSubscribers(data);
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSendPush() {
    if (!pushTitle.trim() || !pushBody.trim()) return;
    setPushSending(true);
    setPushResult(null);
    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pushTitle.trim(),
          body: pushBody.trim(),
          url: pushUrl.trim() || "/",
          ...(pushLocale ? { locale: pushLocale } : {}),
        }),
      });
      const data = await res.json() as { sent?: number; failed?: number; expired?: number; total?: number; error?: string };
      setPushResult(data);
      if (res.ok) {
        setPushTitle("");
        setPushBody("");
        loadSubscribers();
      }
    } catch {
      setPushResult({ error: "Erreur réseau" });
    } finally {
      setPushSending(false);
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

      {/* Push broadcast */}
      <Card>
        <CardHeader>
          <p className="flex items-center gap-2 font-label text-xs font-extrabold uppercase tracking-wider text-muted">
            <Send className="h-4 w-4" /> Notifications push (lecteurs)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-body text-sm text-muted">
              Envoyez une notification push aux lecteurs qui ont accepté les alertes sur leur appareil.
            </p>
            <button
              type="button"
              onClick={loadSubscribers}
              disabled={pushSubscribersLoading}
              className="shrink-0 font-label text-[11px] font-bold text-muted hover:text-foreground disabled:opacity-50"
            >
              {pushSubscribersLoading ? "…" : "↺"}
            </button>
          </div>
          {pushSubscribers !== null && (
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 border border-border-subtle bg-surface-newsprint px-2.5 py-1 font-label text-xs font-bold text-foreground">
                <Bell className="h-3 w-3 text-primary" aria-hidden />
                {pushSubscribers.total} abonné{pushSubscribers.total !== 1 ? "s" : ""} au total
              </span>
              {Object.entries(pushSubscribers.byLocale).map(([loc, count]) => (
                <span key={loc} className="inline-flex items-center gap-1 border border-border-subtle bg-surface-newsprint px-2.5 py-1 font-label text-xs text-muted">
                  {loc === "fr" ? "🇫🇷" : loc === "en" ? "🇺🇸" : "🌐"} {count}
                </span>
              ))}
            </div>
          )}

          {pushResult && (
            pushResult.error ? (
              <div className="flex items-center gap-2 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {pushResult.error}
              </div>
            ) : (
              <div className="flex items-center gap-2 border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                Envoyé à {pushResult.sent} / {pushResult.total} abonné{(pushResult.total ?? 0) > 1 ? "s" : ""}
                {(pushResult.failed ?? 0) > 0 && ` (${pushResult.failed} échec${(pushResult.failed ?? 0) > 1 ? "s" : ""})`}
                {(pushResult.expired ?? 0) > 0 && ` · ${pushResult.expired} expirée${(pushResult.expired ?? 0) > 1 ? "s" : ""} supprimée${(pushResult.expired ?? 0) > 1 ? "s" : ""}`}.
              </div>
            )
          )}

          <div>
            <label className="mb-1 block font-label text-xs font-bold uppercase text-muted">Titre *</label>
            <input
              type="text"
              value={pushTitle}
              onChange={(e) => setPushTitle(e.target.value)}
              placeholder="Nouvel article publié"
              maxLength={80}
              className="w-full border border-border-subtle bg-surface px-3 py-2 font-body text-sm text-foreground"
            />
          </div>
          <div>
            <label className="mb-1 block font-label text-xs font-bold uppercase text-muted">Message *</label>
            <textarea
              value={pushBody}
              onChange={(e) => setPushBody(e.target.value)}
              placeholder="Lisez notre dernier article…"
              rows={2}
              maxLength={180}
              className="w-full border border-border-subtle bg-surface px-3 py-2 font-body text-sm text-foreground"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block font-label text-xs font-bold uppercase text-muted">URL cible</label>
              <input
                type="text"
                value={pushUrl}
                onChange={(e) => setPushUrl(e.target.value)}
                placeholder="/"
                className="w-full border border-border-subtle bg-surface px-3 py-2 font-body text-sm text-foreground"
              />
            </div>
            <div>
              <label className="mb-1 block font-label text-xs font-bold uppercase text-muted">Langue</label>
              <select
                value={pushLocale}
                onChange={(e) => setPushLocale(e.target.value as "" | "fr" | "en")}
                className="border border-border-subtle bg-surface px-3 py-2 font-label text-sm text-foreground"
              >
                <option value="">Toutes</option>
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSendPush}
            disabled={pushSending || !pushTitle.trim() || !pushBody.trim()}
            className="inline-flex items-center gap-2 bg-primary px-4 py-2 font-label text-xs font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" aria-hidden />
            {pushSending ? "Envoi…" : "Envoyer la notification"}
          </button>
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
