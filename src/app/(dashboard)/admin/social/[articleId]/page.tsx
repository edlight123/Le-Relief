"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock3, Image as ImageIcon, LayoutGrid, Megaphone, MessageCircle, MonitorPlay } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Card, { CardContent } from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import PlatformPanel from "@/components/dashboard/social/PlatformPanel";
import type { PlatformId } from "@le-relief/types";
import type { SocialPost, SocialPostStatus } from "@/types/social";

const PLATFORMS: PlatformId[] = [
  "instagram-feed",
  "instagram-story",
  "facebook-feed",
  "facebook-link",
  "x-portrait",
  "x-landscape",
  "whatsapp-status",
  "whatsapp-sticker",
  "threads",
  "tiktok",
  "linkedin-feed",
  "linkedin-link",
  "youtube-short-cover",
  "instagram-reel-cover",
];

const PLATFORM_GROUPS = [
  {
    id: "instagram",
    label: "Instagram",
    description: "Carousel, stories et couvertures Reels.",
    icon: LayoutGrid,
    platforms: ["instagram-feed", "instagram-story", "instagram-reel-cover"] as PlatformId[],
  },
  {
    id: "facebook",
    label: "Facebook",
    description: "Légende + lien en priorité, puis visuel de support.",
    icon: Megaphone,
    platforms: ["facebook-feed", "facebook-link"] as PlatformId[],
  },
  {
    id: "conversation",
    label: "Conversation",
    description: "X, Threads et WhatsApp en formats copy/paste.",
    icon: MessageCircle,
    platforms: ["x-portrait", "x-landscape", "threads", "whatsapp-status", "whatsapp-sticker"] as PlatformId[],
  },
  {
    id: "pro-video",
    label: "Pro & vidéo",
    description: "LinkedIn, TikTok et YouTube Shorts.",
    icon: MonitorPlay,
    platforms: ["linkedin-feed", "linkedin-link", "tiktok", "youtube-short-cover"] as PlatformId[],
  },
] as const;

type PlatformGroupId = (typeof PLATFORM_GROUPS)[number]["id"];

export default function SocialEditorPage() {
  const params = useParams<{ articleId: string }>();
  const articleId = params.articleId;
  const [post, setPost] = useState<SocialPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<PlatformGroupId>("instagram");

  const activeGroup = PLATFORM_GROUPS.find((group) => group.id === activeGroupId) ?? PLATFORM_GROUPS[0];
  const renderedPlatforms = useMemo(() => post ? Object.keys(post.platforms).length : 0, [post]);
  const approvedOrReady = post?.status === "approved" || post?.status === "ready";
  const activeRenderedCount = useMemo(
    () => activeGroup.platforms.filter((platform) => Boolean(post?.platforms[platform])).length,
    [activeGroup.platforms, post],
  );

  useEffect(() => {
    let cancel = false;
    async function load() {
      try {
        const r = await fetch(`/api/admin/social/post/${articleId}`);
        const j = await r.json();
        if (!cancel) setPost(j.post ?? null);
      } catch (err) {
        if (!cancel) setError(String(err));
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    load();
    return () => {
      cancel = true;
    };
  }, [articleId]);

  async function generate(all = true) {
    setRendering(true);
    setError(null);
    setWarnings([]);
    try {
      const r = await fetch(`/api/admin/social/render`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ articleId, platforms: all ? PLATFORMS : undefined }),
      });
      const text = await r.text();
      let j: {
        post?: typeof post;
        warnings?: string[];
        error?: string;
        detail?: string;
      } = {};
      try {
        j = text ? JSON.parse(text) : {};
      } catch {
        j = { error: `HTTP ${r.status}`, detail: text.slice(0, 300) };
      }
      if (!r.ok) {
        const parts = [j.error ?? `HTTP ${r.status}`];
        if (j.detail) parts.push(j.detail);
        if (j.warnings?.length) parts.push(j.warnings.join(" · "));
        setError(parts.join(" — "));
        if (j.warnings?.length) setWarnings(j.warnings);
        return;
      }
      setPost(j.post ?? null);
      setWarnings(j.warnings ?? []);
    } catch (err) {
      setError(String(err));
    } finally {
      setRendering(false);
    }
  }

  async function generateActiveGroup() {
    setRendering(true);
    setError(null);
    setWarnings([]);
    try {
      const r = await fetch(`/api/admin/social/render`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ articleId, platforms: activeGroup.platforms }),
      });
      const text = await r.text();
      let j: {
        post?: typeof post;
        warnings?: string[];
        error?: string;
        detail?: string;
      } = {};
      try {
        j = text ? JSON.parse(text) : {};
      } catch {
        j = { error: `HTTP ${r.status}`, detail: text.slice(0, 300) };
      }
      if (!r.ok) {
        setError([j.error ?? `HTTP ${r.status}`, j.detail, j.warnings?.join(" · ")].filter(Boolean).join(" — "));
        if (j.warnings?.length) setWarnings(j.warnings);
        return;
      }
      setPost(j.post ?? null);
      setWarnings(j.warnings ?? []);
    } catch (err) {
      setError(String(err));
    } finally {
      setRendering(false);
    }
  }

  async function updateStatus(status: SocialPostStatus) {
    setError(null);
    try {
      const r = await fetch("/api/admin/social/status", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ articleId, status }),
      });
      const j = await r.json();
      if (!r.ok) {
        setError(j.error ?? `HTTP ${r.status}`);
        return;
      }
      setPost(j.post ?? null);
    } catch (err) {
      setError(String(err));
    }
  }

  if (loading) {
    return <div className="p-8 font-body text-sm text-muted">Chargement…</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        kicker="Réseaux sociaux"
        title={post?.articleTitle ?? "Génération sociale"}
        description={
          post
            ? `${post.brandName} · ${renderedPlatforms}/14 plateformes · ${approvedOrReady ? "prêt pour publication" : "à finaliser"}`
            : "Générez les formats sociaux par famille de plateformes, puis validez les légendes avant publication."
        }
        actions={
          <>
            <Link href="/admin/social" prefetch={false} className="font-label text-xs uppercase tracking-wider text-muted hover:text-foreground">
              ← Retour
            </Link>
            <Button variant="secondary" onClick={generateActiveGroup} disabled={rendering}>
              {rendering ? "Rendu…" : `Rendre ${activeGroup.label}`}
            </Button>
            <Button onClick={() => generate(true)} disabled={rendering}>
              {rendering ? "Rendu en cours…" : post ? "Re-générer toutes les images" : "Générer toutes les images"}
            </Button>
          </>
        }
      />

      <div className="grid gap-3 md:grid-cols-3">
        <Card><CardContent className="flex items-center gap-3 p-4"><LayoutGrid className="h-5 w-5 text-primary" /><div><p className="font-mono text-2xl font-bold">{renderedPlatforms}</p><p className="font-label text-[11px] uppercase text-muted">plateformes rendues</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><CheckCircle2 className="h-5 w-5 text-accent-teal" /><div><p className="font-mono text-2xl font-bold">{post?.status === "approved" ? "OK" : "—"}</p><p className="font-label text-[11px] uppercase text-muted">validation</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><Clock3 className="h-5 w-5 text-accent-amber" /><div><p className="font-mono text-2xl font-bold">{warnings.length}</p><p className="font-label text-[11px] uppercase text-muted">avertissements</p></div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-label text-xs uppercase tracking-wider text-muted">Familles de plateformes</p>
              <p className="font-body text-sm text-muted">Naviguez par usage : carousel visuel, lien Facebook, conversation, ou formats pro/vidéo.</p>
            </div>
            <Badge variant={activeRenderedCount === activeGroup.platforms.length ? "success" : activeRenderedCount > 0 ? "info" : "default"}>
              {activeRenderedCount}/{activeGroup.platforms.length} rendus
            </Badge>
          </div>
          <div className="grid gap-2 md:grid-cols-4">
            {PLATFORM_GROUPS.map((group) => {
              const Icon = group.icon;
              const count = group.platforms.filter((platform) => Boolean(post?.platforms[platform])).length;
              const active = group.id === activeGroupId;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setActiveGroupId(group.id)}
                  className={`rounded-sm border p-3 text-left transition-colors ${active ? "border-primary bg-primary/10" : "border-border-subtle bg-background hover:border-primary"}`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="font-mono text-xs text-muted">{count}/{group.platforms.length}</span>
                  </div>
                  <p className="font-label text-xs uppercase tracking-wider text-foreground">{group.label}</p>
                  <p className="mt-1 line-clamp-2 font-body text-xs text-muted">{group.description}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {post && ["ready", "needs_review", "approved"].includes(post.status) && (
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <span className="font-label text-xs uppercase tracking-wider text-muted">Statut d&apos;approbation</span>
            <Badge
              variant={
                post.status === "approved"
                  ? "success"
                  : post.status === "needs_review"
                  ? "warning"
                  : "info"
              }
            >
              {post.status === "approved"
                ? "Approuvé"
                : post.status === "needs_review"
                ? "En révision"
                : "Prêt"}
            </Badge>
            <div className="ml-auto flex gap-2">
              {post.status !== "needs_review" && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => updateStatus("needs_review")}
                >
                  Marquer pour révision
                </Button>
              )}
              {(post.status === "ready" || post.status === "needs_review") && (
                <Button size="sm" onClick={() => updateStatus("approved")}>
                  Approuver
                </Button>
              )}
              {post.status === "approved" && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => updateStatus("ready")}
                >
                  Révoquer l&apos;approbation
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="rounded border border-danger/40 bg-danger/10 p-3 font-body text-sm text-danger">
          {error}
        </div>
      )}
      {warnings.length > 0 && (
        <div className="rounded border border-warning/40 bg-warning/10 p-3 font-body text-sm">
          <div className="mb-1 font-bold">Avertissements de rendu</div>
          <ul className="list-disc pl-5">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {!post && !rendering ? (
        <EmptyState
          icon={ImageIcon}
          title="Aucun rendu pour cet article"
          description="Cliquez sur « Générer toutes les images » ou choisissez une famille de plateformes à rendre."
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-sm border border-border-subtle bg-surface p-3">
            <div>
              <p className="font-label text-xs uppercase tracking-wider text-foreground">{activeGroup.label}</p>
              <p className="font-body text-sm text-muted">{activeGroup.description}</p>
            </div>
            <Button variant="outline" size="sm" onClick={generateActiveGroup} disabled={rendering}>
              {rendering ? "Rendu…" : "Rendre ce groupe"}
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {activeGroup.platforms.map((p) => {
            const state = post?.platforms[p];
            if (!state) {
              return (
                <Card key={p}>
                  <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 p-6 text-center">
                    <ImageIcon className="h-8 w-8 text-muted" />
                    <div>
                      <p className="font-label text-xs uppercase tracking-wider text-foreground">{p}</p>
                      <p className="mt-1 font-body text-sm text-muted">Pas encore rendu pour cette plateforme.</p>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => generateActiveGroup()} disabled={rendering}>
                      Rendre le groupe
                    </Button>
                  </CardContent>
                </Card>
              );
            }
            return (
              <PlatformPanel
                key={p}
                post={post!}
                platform={p}
                state={state}
                onPostUpdated={setPost}
              />
            );
          })}
          </div>
        </div>
      )}

      {post && <AuditLog articleId={articleId} />}
    </div>
  );
}

type AuditEvent = {
  id: string;
  type: string;
  platform?: string | null;
  actorId?: string | null;
  message?: string | null;
  createdAt: string;
};

function AuditLog({ articleId }: { articleId: string }) {
  const [events, setEvents] = useState<AuditEvent[] | null>(null);
  const [open, setOpen] = useState(false);

  async function load() {
    const r = await fetch(`/api/admin/social/events/${articleId}`);
    const j = await r.json();
    setEvents(j.events ?? []);
  }

  return (
    <details
      className="rounded border border-border-subtle bg-surface p-3"
      onToggle={(e) => {
        const o = (e.target as HTMLDetailsElement).open;
        setOpen(o);
        if (o && !events) load();
      }}
    >
      <summary className="cursor-pointer font-label text-sm font-bold uppercase tracking-wider">
        Journal d&apos;activité
      </summary>
      {open && (
        <div className="mt-3 max-h-96 overflow-auto">
          {!events ? (
            <p className="font-body text-sm text-muted">Chargement…</p>
          ) : events.length === 0 ? (
            <p className="font-body text-sm text-muted">Aucun événement.</p>
          ) : (
            <ul className="space-y-1 font-mono text-xs">
              {events.map((e) => (
                <li key={e.id} className="border-b border-border-subtle/50 py-1">
                  <span className="text-muted">{new Date(e.createdAt).toLocaleString()}</span>
                  {" · "}
                  <span className="font-bold">{e.type}</span>
                  {e.platform && <> · {e.platform}</>}
                  {e.message && <> — {e.message}</>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </details>
  );
}
