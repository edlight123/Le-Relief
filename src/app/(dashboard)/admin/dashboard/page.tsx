"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import StatsCards from "@/components/dashboard/StatsCards";
import { LayoutDashboard, Users, FileText, ClipboardCheck, CheckCircle2, CalendarClock, PenSquare, Send, RotateCcw, Rocket, CheckCircle, AlertTriangle } from "lucide-react";
import type { Stat } from "@/components/dashboard/StatsCards";

type StatusKey = "draft" | "in_review" | "approved" | "scheduled" | "published";

export default function AdminDashboardPage() {
  const [counts, setCounts] = useState<Record<StatusKey, number>>({
    draft: 0,
    in_review: 0,
    approved: 0,
    scheduled: 0,
    published: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const statuses: StatusKey[] = ["draft", "in_review", "approved", "scheduled", "published"];
    try {
      const responses = await Promise.all(
        statuses.map((status) =>
          fetch(`/api/articles?status=${status}&take=1`).then((r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
          }),
        ),
      );

      const next: Record<StatusKey, number> = {
        draft: 0,
        in_review: 0,
        approved: 0,
        scheduled: 0,
        published: 0,
      };

      statuses.forEach((status, idx) => {
        const payload = responses[idx] as { total?: number; count?: number; articles?: unknown[] };
        next[status] = payload.total ?? payload.count ?? payload.articles?.length ?? 0;
      });

      setCounts(next);
      setError(null);
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
      setError("Impossible de charger les statistiques. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats: Stat[] = useMemo(
    () => [
      { label: "Brouillons", value: counts.draft, icon: PenSquare, color: "amber" },
      { label: "En review", value: counts.in_review, icon: Send, color: "blue" },
      { label: "Approuvés", value: counts.approved, icon: CheckCircle, color: "teal" },
      { label: "Programmés", value: counts.scheduled, icon: CalendarClock, color: "amber" },
      { label: "Publiés", value: counts.published, icon: Rocket, color: "red" },
    ],
    [counts],
  );

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Admin"
        title="Tableau de bord"
        description="Vue synthétique des flux éditoriaux et de publication."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="default">
              <LayoutDashboard className="mr-1 h-3 w-3" />
              Gouvernance
            </Badge>
            <Badge variant="info">
              <Users className="mr-1 h-3 w-3" />
              Admin
            </Badge>
          </div>
        }
      />

      {error ? (
        <div
          className="rounded-none border border-primary/20 bg-primary/5 p-5 flex items-start gap-4"
          role="alert"
        >
          <AlertTriangle className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="font-body text-sm font-semibold text-foreground">Erreur de chargement</p>
            <p className="mt-1 font-body text-sm text-muted">{error}</p>
            <button
              type="button"
              onClick={load}
              className="mt-3 inline-flex items-center gap-1.5 font-label text-xs font-extrabold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Réessayer
            </button>
          </div>
        </div>
      ) : null}

      <StatsCards stats={stats} loading={loading} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="space-y-3 px-5 py-4">
            <p className="font-label text-xs font-extrabold uppercase tracking-wider text-muted">Opérations</p>
            <div className="space-y-2">
              <Link href="/admin/review" className="flex items-center gap-2 font-body text-sm text-foreground hover:text-primary">
                <ClipboardCheck className="h-4 w-4" /> Ouvrir la review queue
              </Link>
              <Link href="/admin/publishing" className="flex items-center gap-2 font-body text-sm text-foreground hover:text-primary">
                <CheckCircle2 className="h-4 w-4" /> Ouvrir le desk publication
              </Link>
              <Link href="/admin/publishing/scheduled" className="flex items-center gap-2 font-body text-sm text-foreground hover:text-primary">
                <CalendarClock className="h-4 w-4" /> Gérer les programmations
              </Link>
            </div>
          </div>
        </Card>

        <Card>
          <div className="space-y-3 px-5 py-4">
            <p className="font-label text-xs font-extrabold uppercase tracking-wider text-muted">Gouvernance</p>
            <div className="space-y-2">
              <Link href="/admin/users" className="flex items-center gap-2 font-body text-sm text-foreground hover:text-primary">
                <Users className="h-4 w-4" /> Gestion utilisateurs
              </Link>
              <Link href="/admin/articles" className="flex items-center gap-2 font-body text-sm text-foreground hover:text-primary">
                <FileText className="h-4 w-4" /> Inventaire des articles
              </Link>
              <Link href="/admin/settings" className="flex items-center gap-2 font-body text-sm text-foreground hover:text-primary">
                <LayoutDashboard className="h-4 w-4" /> Paramètres
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}