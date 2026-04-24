"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plug, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import type { ConnectionPlatform, SocialConnection } from "@/types/social";

interface ConnDef {
  platform: ConnectionPlatform;
  label: string;
  description: string;
  startUrl?: string;
  comingSoon?: boolean;
}

const CONNECTIONS: ConnDef[] = [
  {
    platform: "meta",
    label: "Meta (Instagram + Facebook)",
    description: "Publication directe sur la Page Facebook et le compte Instagram Business associé.",
    startUrl: "/api/admin/social/connections/meta/start",
  },
  {
    platform: "x",
    label: "X (Twitter)",
    description: "Mode copier-coller en V1. API à venir (nécessite l'abonnement payant).",
    comingSoon: true,
  },
  {
    platform: "linkedin",
    label: "LinkedIn",
    description: "Publication via Marketing API (nécessite la Community Management Product).",
    comingSoon: true,
  },
  {
    platform: "threads",
    label: "Threads",
    description: "API publique Meta (en développement).",
    comingSoon: true,
  },
  {
    platform: "tiktok",
    label: "TikTok",
    description: "Content Posting API (revue d'application requise).",
    comingSoon: true,
  },
  {
    platform: "youtube",
    label: "YouTube",
    description: "YouTube Data API v3 — vidéos Shorts.",
    comingSoon: true,
  },
  {
    platform: "whatsapp",
    label: "WhatsApp",
    description: "Mode copier-coller uniquement (pas d'API officielle pour Status).",
    comingSoon: true,
  },
];

export default function ConnectionsPage() {
  const params = useSearchParams();
  const [conns, setConns] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const flash = params.get("connected")
    ? `${params.get("connected")} connecté avec succès.`
    : params.get("error") ?? null;

  async function reload() {
    const r = await fetch("/api/admin/social/connections");
    const j = await r.json();
    setConns(j.connections ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, []);

  async function disconnect(platform: ConnectionPlatform) {
    if (!confirm(`Déconnecter ${platform} ?`)) return;
    await fetch("/api/admin/social/connections", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ platform }),
    });
    reload();
  }

  const byPlatform = new Map(conns.map((c) => [c.platform, c] as const));

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        kicker="Réseaux sociaux"
        title="Connexions"
        description="Autorisations OAuth pour publier directement depuis Le Relief."
      />
      {flash && (
        <div className="rounded border border-primary/40 bg-primary/10 p-3 font-body text-sm">
          {flash}
        </div>
      )}
      {loading ? (
        <div className="font-body text-sm text-muted">Chargement…</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {CONNECTIONS.map((def) => {
            const c = byPlatform.get(def.platform);
            const connected = c?.status === "connected";
            return (
              <Card key={def.platform}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Plug className="h-4 w-4 text-muted" />
                      <h3 className="font-label text-sm font-bold uppercase tracking-wider">
                        {def.label}
                      </h3>
                    </div>
                    {connected ? (
                      <Badge variant="success">
                        <CheckCircle2 className="mr-1 inline h-3 w-3" />
                        Connecté
                      </Badge>
                    ) : def.comingSoon ? (
                      <Badge variant="default">À venir</Badge>
                    ) : (
                      <Badge variant="warning">
                        <AlertTriangle className="mr-1 inline h-3 w-3" />
                        Non connecté
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="font-body text-sm text-muted">{def.description}</p>
                  {connected && (
                    <div className="font-body text-xs text-muted">
                      Compte&nbsp;: <span className="font-mono text-foreground">{c?.accountName ?? c?.accountId}</span>
                      {c?.expiresAt && (
                        <>
                          <br />
                          Expire&nbsp;: {new Date(c.expiresAt).toLocaleString()}
                        </>
                      )}
                      {c?.metadata?.igUserId && (
                        <>
                          <br />
                          IG&nbsp;: <span className="font-mono text-foreground">{c.metadata.igUserId}</span>
                        </>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2">
                    {def.startUrl && !def.comingSoon && (
                      <Button
                        size="sm"
                        variant={connected ? "secondary" : "primary"}
                        onClick={() => {
                          window.location.href = def.startUrl!;
                        }}
                      >
                        {connected ? "Reconnecter" : "Connecter"}
                      </Button>
                    )}
                    {connected && (
                      <Button size="sm" variant="outline" onClick={() => disconnect(def.platform)}>
                        <XCircle className="mr-1 h-3 w-3" />
                        Déconnecter
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
