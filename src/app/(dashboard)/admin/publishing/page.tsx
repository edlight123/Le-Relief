"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNow, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CheckCircle2,
  CalendarClock,
  Rocket,
  Home,
  AlertTriangle,
  Zap,
} from "lucide-react";

import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";

interface Article {
  id: string;
  title: string;
  status: string;
  language?: "fr" | "en";
  approvedAt?: string | null;
  scheduledAt?: string | null;
  updatedAt: string;
  priorityLevel?: string | null;
  isBreaking?: boolean;
  isHomepagePinned?: boolean;
  author?: { name: string | null } | null;
  category?: { name: string } | null;
}

interface DashboardState {
  approved: Article[];
  scheduled: Article[];
  loading: boolean;
  error: string | null;
}

export default function AdminPublishingPage() {
  const [state, setState] = useState<DashboardState>({
    approved: [],
    scheduled: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [approvedRes, scheduledRes] = await Promise.all([
          fetch("/api/articles?status=approved&take=100"),
          fetch("/api/articles?status=scheduled&take=100"),
        ]);

        const approvedJson = await approvedRes.json();
        const scheduledJson = await scheduledRes.json();

        setState({
          approved: approvedJson.articles ?? [],
          scheduled: scheduledJson.articles ?? [],
          loading: false,
          error: null,
        });
      } catch {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Erreur lors du chargement des données.",
        }));
      }
    }

    fetchData();
  }, []);

  const { approved, scheduled, loading } = state;

  const approvedCount = approved.length;
  const scheduledCount = scheduled.length;
  const breakingItems = [
    ...approved.filter((a) => a.isBreaking),
    ...scheduled.filter((a) => a.isBreaking),
  ];
  const breakingCount = breakingItems.length;
  const homepageCandidateCount = approved.filter(
    (a) => a.isHomepagePinned
  ).length;

  const scheduledToday = scheduled.filter(
    (a) => a.scheduledAt && isToday(new Date(a.scheduledAt))
  );

  const top5Approved = [...approved]
    .sort((a, b) => {
      const aTime = a.approvedAt ? new Date(a.approvedAt).getTime() : 0;
      const bTime = b.approvedAt ? new Date(b.approvedAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 5);

  const todayLabel = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });

  const kpiTiles = [
    {
      label: "Prêts à publier",
      value: approvedCount,
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      href: "/dashboard/approved",
    },
    {
      label: "Programmés",
      value: scheduledCount,
      icon: <CalendarClock className="w-5 h-5 text-blue-500" />,
      href: "/dashboard/scheduled",
    },
    {
      label: "Breaking en attente",
      value: breakingCount,
      icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
      href: null,
    },
    {
      label: "Candidats Une",
      value: homepageCandidateCount,
      icon: <Home className="w-5 h-5 text-purple-500" />,
      href: null,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Publication"
        title="Tableau de publication"
        description={todayLabel}
        actions={
          <Link
            href="/dashboard/approved"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-label text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            File approuvée →
          </Link>
        }
      />

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {kpiTiles.map((tile) => {
          const inner = (
            <div className="border rounded-xl bg-surface p-5 flex flex-col gap-2 hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-label text-[11px] uppercase tracking-wider text-muted">
                  {tile.label}
                </span>
                {tile.icon}
              </div>
              {loading ? (
                <div className="h-9 w-16 rounded bg-muted/30 animate-pulse" />
              ) : (
                <span className="font-headline text-3xl font-extrabold">
                  {tile.value}
                </span>
              )}
            </div>
          );

          return tile.href ? (
            <Link key={tile.label} href={tile.href}>
              {inner}
            </Link>
          ) : (
            <div key={tile.label}>{inner}</div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Programmés aujourd'hui */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-blue-500" />
              <span className="font-headline font-bold text-base">
                Programmés aujourd&apos;hui
              </span>
              {!loading && scheduledToday.length > 0 && (
                <Badge variant="default">{scheduledToday.length}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-10 rounded bg-muted/30 animate-pulse"
                  />
                ))}
              </div>
            ) : scheduledToday.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="Aucune publication programmée aujourd'hui"
              />
            ) : (
              <ul className="divide-y divide-border">
                {scheduledToday.map((article) => (
                  <li key={article.id} className="py-3">
                    <Link
                      href={`/dashboard/articles/${article.id}/edit`}
                      className="flex items-start justify-between gap-3 group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {article.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {article.category && (
                            <span className="font-label text-[10px] uppercase tracking-wider text-muted">
                              {article.category.name}
                            </span>
                          )}
                          {article.language && (
                            <Badge variant="default" className="text-[10px]">
                              {article.language.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <span className="font-label text-sm font-semibold text-blue-500 whitespace-nowrap shrink-0">
                        {format(new Date(article.scheduledAt!), "HH:mm")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Prêts à publier */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Rocket className="w-4 h-4 text-green-500" />
              <span className="font-headline font-bold text-base">
                Prêts à publier
              </span>
              {!loading && top5Approved.length > 0 && (
                <Badge variant="default">{approvedCount}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-10 rounded bg-muted/30 animate-pulse"
                  />
                ))}
              </div>
            ) : top5Approved.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="Aucun article prêt à publier"
                actionHref="/dashboard/articles"
                actionLabel="Voir la file de révision"
              />
            ) : (
              <ul className="divide-y divide-border">
                {top5Approved.map((article) => (
                  <li key={article.id} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/dashboard/articles/${article.id}/edit`}
                          className="font-body text-sm font-medium truncate block hover:text-primary transition-colors"
                        >
                          {article.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {article.author?.name && (
                            <span className="font-label text-[10px] text-muted">
                              {article.author.name}
                            </span>
                          )}
                          {article.category && (
                            <span className="font-label text-[10px] uppercase tracking-wider text-muted">
                              · {article.category.name}
                            </span>
                          )}
                          {article.approvedAt && (
                            <span className="font-label text-[10px] text-muted">
                              ·{" "}
                              {formatDistanceToNow(
                                new Date(article.approvedAt),
                                { addSuffix: true, locale: fr }
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <Link
                        href="/dashboard/approved"
                        className="shrink-0 font-label text-[11px] font-semibold text-primary hover:underline whitespace-nowrap"
                      >
                        Publier →
                      </Link>
                    </div>
                  </li>
                ))}
                {approvedCount > 5 && (
                  <li className="pt-3">
                    <Link
                      href="/dashboard/approved"
                      className="font-label text-xs text-muted hover:text-primary transition-colors"
                    >
                      + {approvedCount - 5} autres dans la file approuvée
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Breaking / Priorité */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-red-500" />
            <span className="font-headline font-bold text-base">
              Breaking / Priorité
            </span>
            {!loading && breakingCount > 0 && (
              <Badge variant="danger">{breakingCount}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-10 rounded bg-muted/30 animate-pulse"
                />
              ))}
            </div>
          ) : breakingItems.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="Aucun article breaking en attente"
            />
          ) : (
            <ul className="divide-y divide-border">
              {breakingItems.map((article) => (
                <li key={article.id} className="py-3">
                  <Link
                    href={`/dashboard/articles/${article.id}/edit`}
                    className="flex items-start gap-3 group"
                  >
                    <Badge variant="danger" className="shrink-0 mt-0.5">
                      Breaking
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {article.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {article.category && (
                          <span className="font-label text-[10px] uppercase tracking-wider text-muted">
                            {article.category.name}
                          </span>
                        )}
                        <Badge
                          variant={
                            article.status === "approved"
                              ? "success"
                              : "default"
                          }
                          className="text-[10px]"
                        >
                          {article.status === "approved"
                            ? "Approuvé"
                            : "Programmé"}
                        </Badge>
                        {article.language && (
                          <Badge variant="default" className="text-[10px]">
                            {article.language.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {article.scheduledAt && (
                      <span className="font-label text-[11px] text-blue-500 whitespace-nowrap shrink-0">
                        {isToday(new Date(article.scheduledAt))
                          ? format(new Date(article.scheduledAt), "HH:mm")
                          : format(
                              new Date(article.scheduledAt),
                              "d MMM HH:mm",
                              { locale: fr }
                            )}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
