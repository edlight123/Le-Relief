"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import { LayoutDashboard, Users, FileText, ClipboardCheck, CheckCircle2, CalendarClock } from "lucide-react";

type StatusKey = "draft" | "in_review" | "approved" | "scheduled" | "published";

interface StatusCount {
  key: StatusKey;
  label: string;
  value: number;
  href: string;
}

export default function AdminDashboardPage() {
  const [counts, setCounts] = useState<Record<StatusKey, number>>({
    draft: 0,
    in_review: 0,
    approved: 0,
    scheduled: 0,
    published: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const statuses: StatusKey[] = ["draft", "in_review", "approved", "scheduled", "published"];
      const responses = await Promise.all(
        statuses.map((status) =>
          fetch(`/api/articles?status=${status}&take=1`).then((r) => r.json()).catch(() => ({ total: 0 })),
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
      setLoading(false);
    }
    load();
  }, []);

  const tiles: StatusCount[] = useMemo(
    () => [
      { key: "draft", label: "Brouillons", value: counts.draft, href: "/admin/articles" },
      { key: "in_review", label: "En review", value: counts.in_review, href: "/admin/review" },
      { key: "approved", label: "Approuvés", value: counts.approved, href: "/admin/publishing/ready" },
      { key: "scheduled", label: "Programmés", value: counts.scheduled, href: "/admin/publishing/scheduled" },
      { key: "published", label: "Publiés", value: counts.published, href: "/admin/publishing/published" },
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {tiles.map((tile) => (
          <Link key={tile.key} href={tile.href}>
            <Card>
              <div className="space-y-2 px-5 py-4">
                <p className="font-label text-[11px] font-extrabold uppercase tracking-wider text-muted">{tile.label}</p>
                <p className="font-headline text-3xl font-extrabold text-foreground">
                  {loading ? "—" : tile.value}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

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
