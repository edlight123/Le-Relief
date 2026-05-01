"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Image as ImageIcon } from "lucide-react";
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

export default function SocialEditorPage() {
  const params = useParams<{ articleId: string }>();
  const articleId = params.articleId;
  const [post, setPost] = useState<SocialPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

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
            ? `Brand : ${post.brandName} · ${Object.keys(post.platforms).length} plateforme(s) rendue(s)`
            : "Aucun rendu pour cet article."
        }
        actions={
          <>
            <Link href="/admin/social" className="font-label text-xs uppercase tracking-wider text-muted hover:text-foreground">
              ← Retour
            </Link>
            <Button onClick={() => generate(true)} disabled={rendering}>
              {rendering ? "Rendu en cours…" : post ? "Re-générer toutes les images" : "Générer toutes les images"}
            </Button>
          </>
        }
      />

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
          description="Cliquez sur « Générer » pour produire les images des 14 plateformes."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {PLATFORMS.map((p) => {
            const state = post?.platforms[p];
            if (!state) return null;
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
