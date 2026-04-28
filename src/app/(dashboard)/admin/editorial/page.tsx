import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb, serializeTimestamps } from "@/lib/firebase";
import * as articlesRepo from "@/lib/repositories/articles";
import * as usersRepo from "@/lib/repositories/users";
import StatsCards from "@/components/dashboard/StatsCards";
import {
  ContentTypePieChart,
  CategoryBarChart,
  WeeklyVelocityChart,
  DailyPublicationChart,
  PipelineTimingChart,
} from "@/components/dashboard/EditorialCharts";
import Card, { CardHeader, CardContent } from "@/components/ui/Card";
import {
  FileText,
  Globe,
  Languages,
  Star,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Home,
  RotateCcw,
  ShieldAlert,
  Timer,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  getWorkflowTimingStats,
  getBlockedArticles,
  getDailyPublicationRate,
} from "@/lib/repositories/editorial/kpis";
import { getEditorialStatusLabel, getEditorialStatusVariant } from "@/lib/editorial-workflow";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CONTENT_TYPE_LABELS: Record<string, string> = {
  actualite: "Actualité",
  analyse: "Analyse",
  opinion: "Opinion",
  editorial: "Éditorial",
  tribune: "Tribune",
  dossier: "Dossier",
  fact_check: "Fact-check",
  emission_speciale: "Émission spéciale",
};

const ALL_STATUSES = [
  "draft",
  "in_review",
  "pending_review",
  "revision_requested",
  "approved",
  "scheduled",
  "published",
  "rejected",
  "archived",
] as const;

function formatHours(h: number | null): string {
  if (h === null) return "—";
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 24) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(1)}j`;
}

export default async function EditorialDashboardPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || (role !== "admin" && role !== "publisher" && role !== "editor")) {
    redirect("/admin");
  }

  const db = getDb();

  // ── Core data ────────────────────────────────────────────────────────────
  let allArticles: Record<string, unknown>[] = [];
  try {
    const snap = await db.collection("articles").get();
    allArticles = snap.docs.map((d) =>
      serializeTimestamps({ id: d.id, ...d.data() } as Record<string, unknown>),
    );
  } catch {
    allArticles = [];
  }

  const frArticles = allArticles.filter((a) => a.language === "fr");
  const enArticles = allArticles.filter((a) => a.language === "en");
  const publishedFr = frArticles.filter((a) => a.status === "published").length;
  const publishedEn = enArticles.filter((a) => a.status === "published").length;
  const breakingCount = allArticles.filter((a) => a.isBreaking === true).length;
  const homepagePinnedCount = allArticles.filter((a) => a.isHomepagePinned === true).length;

  // Status breakdown (all statuses)
  const byStatus: Record<string, number> = {};
  for (const s of ALL_STATUSES) {
    byStatus[s] = allArticles.filter(
      (a) => a.status === s || (s === "in_review" && a.status === "pending_review"),
    ).length;
  }
  // Avoid double-counting pending_review
  byStatus["in_review"] = allArticles.filter(
    (a) => a.status === "in_review" || a.status === "pending_review",
  ).length;
  byStatus["pending_review"] = 0; // merged into in_review above

  // ── KPI computations (audit-based) — soft-fail if indexes missing ────────
  const [timingStats, blockedArticles, dailyRate] = await Promise.all([
    getWorkflowTimingStats().catch(() => ({
      avgDraftToReview: null,
      avgReviewToApproved: null,
      avgApprovedToPublished: null,
      revisionRate: 0,
      totalArticlesSubmitted: 0,
      totalRevised: 0,
    })),
    getBlockedArticles().catch(() => []),
    getDailyPublicationRate(30).catch(() => [] as { date: string; count: number }[]),
  ]);

  // ── Content type distribution ─────────────────────────────────────────────
  const contentTypeCounts: Record<string, number> = {};
  for (const a of allArticles) {
    const ct = (a.contentType as string) || "actualite";
    contentTypeCounts[ct] = (contentTypeCounts[ct] || 0) + 1;
  }
  const contentTypeData = Object.entries(contentTypeCounts).map(([key, value]) => ({
    name: CONTENT_TYPE_LABELS[key] || key,
    value,
  }));

  // ── Category data (with views) ────────────────────────────────────────────
  const categoryStatsById: Record<string, { count: number; views: number }> = {};
  for (const a of allArticles) {
    const catId = (a.categoryId as string) || "uncategorized";
    if (!categoryStatsById[catId]) categoryStatsById[catId] = { count: 0, views: 0 };
    categoryStatsById[catId]!.count++;
    categoryStatsById[catId]!.views += (a.views as number) || 0;
  }
  const catIds = Object.keys(categoryStatsById).filter((id) => id !== "uncategorized");
  const categoryNames: Record<string, string> = {};
  await Promise.all(
    catIds.map(async (id) => {
      try {
        const catSnap = await db.collection("categories").doc(id).get();
        if (catSnap.exists) {
          categoryNames[id] = (catSnap.data()?.name as string) || id;
        }
      } catch {
        // ignore single category lookup failure
      }
    }),
  );
  const categoryData = Object.entries(categoryStatsById)
    .filter(([id]) => id !== "uncategorized")
    .map(([id, { count }]) => ({ name: categoryNames[id] || id, value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Category views table
  const categoryViewsData = Object.entries(categoryStatsById)
    .filter(([id]) => id !== "uncategorized")
    .map(([id, { count, views }]) => ({
      name: categoryNames[id] || id,
      count,
      views,
      avgViews: count > 0 ? Math.round(views / count) : 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);

  // ── Weekly velocity (12 weeks) ────────────────────────────────────────────
  const now = new Date();
  const weeklyVelocity: { week: string; count: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - i * 7 - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const count = allArticles.filter((a) => {
      const pub = a.publishedAt ? new Date(a.publishedAt as string) : null;
      return pub && pub >= weekStart && pub < weekEnd && a.status === "published";
    }).length;
    weeklyVelocity.push({
      week: `S${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
      count,
    });
  }

  // ── Translation stats ─────────────────────────────────────────────────────
  const translationQueue = {
    in_review: enArticles.filter(
      (a) =>
        a.translationStatus === "in_review" || a.translationStatus === "pending_review",
    ).length,
    generated_draft: enArticles.filter((a) => a.translationStatus === "generated_draft").length,
    approved: enArticles.filter((a) => a.translationStatus === "approved").length,
  };
  const translationSuccessRate =
    enArticles.length > 0
      ? Math.round((translationQueue.approved / enArticles.length) * 100)
      : 0;

  const frAllowTranslation = frArticles.filter(
    (a) => a.allowTranslation === true && a.status === "published",
  );
  const enSourceIds = new Set(
    enArticles.map((a) => a.sourceArticleId as string).filter(Boolean),
  );
  const translationBacklog = frAllowTranslation
    .filter((a) => !enSourceIds.has(a.id as string))
    .slice(0, 10);

  // ── Author performance ────────────────────────────────────────────────────
  const authorStats: Record<string, { count: number; views: number; published: number }> = {};
  for (const a of allArticles) {
    const authorId = (a.authorId as string) || "unknown";
    if (!authorStats[authorId]) authorStats[authorId] = { count: 0, views: 0, published: 0 };
    authorStats[authorId]!.count++;
    authorStats[authorId]!.views += (a.views as number) || 0;
    if (a.status === "published") authorStats[authorId]!.published++;
  }
  const authorsWithNames = await Promise.all(
    Object.keys(authorStats).map(async (id) => {
      let user: Record<string, unknown> | null = null;
      try {
        user = await usersRepo.getUser(id);
      } catch {
        user = null;
      }
      const s = authorStats[id]!;
      return {
        id,
        name: (user?.name as string) || "Inconnu",
        ...s,
        avgViews: s.count > 0 ? Math.round(s.views / s.count) : 0,
      };
    }),
  );
  authorsWithNames.sort((a, b) => b.published - a.published);

  // ── Pending + featured ────────────────────────────────────────────────────
  const [inReview, legacyPending] = await Promise.all([
    articlesRepo
      .getArticles({ status: "in_review", take: 5 })
      .catch(() => ({ articles: [] as Record<string, unknown>[] })),
    articlesRepo
      .getArticles({ status: "pending_review", take: 5 })
      .catch(() => ({ articles: [] as Record<string, unknown>[] })),
  ]);
  const pendingArticles = [...inReview.articles, ...legacyPending.articles].slice(0, 5);
  const featured = await articlesRepo.getFeaturedArticle().catch(() => null);

  // ── Stats cards ───────────────────────────────────────────────────────────
  const stats = [
    { label: "Total articles", value: allArticles.length, icon: FileText, color: "blue" as const },
    { label: "Publiés FR", value: publishedFr, icon: Globe, color: "teal" as const },
    { label: "Publiés EN", value: publishedEn, icon: Languages, color: "amber" as const },
    { label: "En revue", value: byStatus["in_review"] || 0, icon: Clock, color: "amber" as const },
    { label: "Approuvés", value: byStatus["approved"] || 0, icon: CheckCircle, color: "teal" as const },
    { label: "Programmés", value: byStatus["scheduled"] || 0, icon: Timer, color: "blue" as const },
    { label: "Breaking", value: breakingCount, icon: Zap, color: "red" as const },
    { label: "Homepage épingé", value: homepagePinnedCount, icon: Home, color: "blue" as const },
  ];

  // Pipeline timing chart data
  const pipelineChartData = [
    {
      stage: "Brouillon → Soumission",
      hours: timingStats.avgDraftToReview ?? 0,
    },
    {
      stage: "Soumission → Approbation",
      hours: timingStats.avgReviewToApproved ?? 0,
    },
    {
      stage: "Approbation → Publication",
      hours: timingStats.avgApprovedToPublished ?? 0,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1 border-t-2 border-border-strong pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="page-kicker mb-1">Rédaction</p>
          <h1 className="font-headline text-5xl font-extrabold leading-none text-foreground">
            Rapport éditorial
          </h1>
          <p className="mt-1 font-label text-xs text-muted">
            {format(now, "EEEE d MMMM yyyy", { locale: fr })} · Données en temps réel
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 font-label text-xs font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-primary-dark"
        >
          Nouvel article
        </Link>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* ── Phase 5: Workflow pipeline ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Daily publication (real audit data) */}
        <Card>
          <CardHeader>
            <h3 className="font-label text-xs font-extrabold uppercase text-foreground">
              Publications journalières (30 jours)
            </h3>
          </CardHeader>
          <CardContent>
            <DailyPublicationChart data={dailyRate} />
          </CardContent>
        </Card>

        {/* Pipeline timing */}
        <Card>
          <CardHeader>
            <h3 className="flex items-center gap-2 font-label text-xs font-extrabold uppercase text-foreground">
              <Timer className="h-3.5 w-3.5 text-accent-blue" />
              Délais moyens du pipeline
            </h3>
          </CardHeader>
          <CardContent>
            {timingStats.totalArticlesSubmitted === 0 ? (
              <EmptyState icon={Timer} title="Pas encore de données" description="Les délais du pipeline apparaîtront une fois les premiers articles soumis." />
            ) : (
              <>
                <PipelineTimingChart data={pipelineChartData} />
                <dl className="mt-4 grid grid-cols-3 gap-4 border-t border-border-subtle pt-4">
                  <div className="text-center">
                    <dt className="font-label text-[10px] font-bold uppercase text-muted">
                      Brouillon → Revue
                    </dt>
                    <dd className="mt-1 font-headline text-xl font-extrabold text-foreground">
                      {formatHours(timingStats.avgDraftToReview)}
                    </dd>
                  </div>
                  <div className="text-center">
                    <dt className="font-label text-[10px] font-bold uppercase text-muted">
                      Revue → Approbation
                    </dt>
                    <dd className="mt-1 font-headline text-xl font-extrabold text-foreground">
                      {formatHours(timingStats.avgReviewToApproved)}
                    </dd>
                  </div>
                  <div className="text-center">
                    <dt className="font-label text-[10px] font-bold uppercase text-muted">
                      Approb. → Publication
                    </dt>
                    <dd className="mt-1 font-headline text-xl font-extrabold text-foreground">
                      {formatHours(timingStats.avgApprovedToPublished)}
                    </dd>
                  </div>
                </dl>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Phase 5: Revision rate + blocked articles ──────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revision rate card */}
        <Card>
          <CardHeader>
            <h3 className="flex items-center gap-2 font-label text-xs font-extrabold uppercase text-foreground">
              <RotateCcw className="h-3.5 w-3.5 text-accent-amber" />
              Taux de révision
            </h3>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 py-2">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-accent-amber/30">
                <span className="font-headline text-2xl font-extrabold text-accent-amber">
                  {timingStats.revisionRate}%
                </span>
              </div>
              <dl className="space-y-2">
                <div className="flex items-center justify-between gap-8">
                  <dt className="font-label text-xs text-muted">Articles soumis</dt>
                  <dd className="font-label text-sm font-bold text-foreground">
                    {timingStats.totalArticlesSubmitted}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-8">
                  <dt className="font-label text-xs text-muted">Articles révisés ≥1×</dt>
                  <dd className="font-label text-sm font-bold text-accent-amber">
                    {timingStats.totalRevised}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-8">
                  <dt className="font-label text-xs text-muted">Publiés direct</dt>
                  <dd className="font-label text-sm font-bold text-accent-teal">
                    {timingStats.totalArticlesSubmitted - timingStats.totalRevised}
                  </dd>
                </div>
              </dl>
            </div>
            <p className="mt-3 font-label text-[11px] text-muted">
              Pourcentage d&apos;articles ayant nécessité au moins une demande de révision avant publication.
            </p>
          </CardContent>
        </Card>

        {/* Blocked articles */}
        <Card>
          <CardHeader>
            <h3 className="flex items-center gap-2 font-label text-xs font-extrabold uppercase text-foreground">
              <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
              Articles bloqués ({blockedArticles.length})
            </h3>
          </CardHeader>
          <CardContent>
            {blockedArticles.length === 0 ? (
              <EmptyState icon={CheckCircle} title="Aucun article bloqué" description="Tous les articles en attente de traduction sont à jour." />
            ) : (
              <ul className="divide-y divide-border-subtle">
                {blockedArticles.map((a) => (
                  <li
                    key={a.articleId}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-body text-sm text-foreground">{a.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant={getEditorialStatusVariant(a.status)}>
                          {getEditorialStatusLabel(a.status)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded bg-red-500/10 px-1.5 py-0.5 font-label text-[10px] font-bold text-red-600">
                        {a.blockingCount} bloquant{a.blockingCount > 1 ? "s" : ""}
                      </span>
                      <Link
                        href={`/admin/articles/${a.articleId}/edit`}
                        className="font-label text-xs text-primary hover:underline"
                      >
                        Éditer
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Charts: velocity + content type ──────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="font-label text-xs font-extrabold uppercase text-foreground">
              Vélocité de publication (12 semaines)
            </h3>
          </CardHeader>
          <CardContent>
            <WeeklyVelocityChart data={weeklyVelocity} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-label text-xs font-extrabold uppercase text-foreground">
              Types de contenu
            </h3>
          </CardHeader>
          <CardContent>
            <ContentTypePieChart data={contentTypeData} />
            <div className="mt-3 flex flex-wrap gap-2">
              {contentTypeData.map((item, i) => (
                <span
                  key={item.name}
                  className="flex items-center gap-1 font-label text-[11px] text-muted"
                >
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: [
                        "#c0392b",
                        "#16a34a",
                        "#2563eb",
                        "#d97706",
                        "#8b5cf6",
                        "#ec4899",
                        "#14b8a6",
                        "#f97316",
                      ][i % 8],
                    }}
                  />
                  {item.name} ({item.value})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category bar */}
      <Card>
        <CardHeader>
          <h3 className="font-label text-xs font-extrabold uppercase text-foreground">
            Articles par catégorie
          </h3>
        </CardHeader>
        <CardContent>
          <CategoryBarChart data={categoryData} />
        </CardContent>
      </Card>

      {/* ── Phase 5: Category performance with views ──────────────────────── */}
      <Card>
        <CardHeader>
          <h3 className="font-label text-xs font-extrabold uppercase text-foreground">
            Performance par catégorie
          </h3>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="pb-2 font-label text-[11px] font-extrabold uppercase text-muted">
                    Catégorie
                  </th>
                  <th className="pb-2 pr-4 text-right font-label text-[11px] font-extrabold uppercase text-muted">
                    Articles
                  </th>
                  <th className="pb-2 pr-4 text-right font-label text-[11px] font-extrabold uppercase text-muted">
                    Vues totales
                  </th>
                  <th className="pb-2 text-right font-label text-[11px] font-extrabold uppercase text-muted">
                    Vues moy.
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {categoryViewsData.map((cat) => (
                  <tr key={cat.name}>
                    <td className="py-2.5 font-body text-sm text-foreground">{cat.name}</td>
                    <td className="py-2.5 pr-4 text-right font-label text-sm tabular-nums text-foreground">
                      {cat.count}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-label text-sm tabular-nums text-foreground">
                      {cat.views.toLocaleString("fr-FR")}
                    </td>
                    <td className="py-2.5 text-right font-label text-sm tabular-nums text-muted">
                      {cat.avgViews.toLocaleString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Full status breakdown + translation ───────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Full status breakdown */}
        <Card>
          <CardHeader>
            <h3 className="font-label text-xs font-extrabold uppercase text-foreground">
              Statuts des articles
            </h3>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2.5">
              {[
                { status: "published", label: "Publiés", color: "text-accent-teal" },
                { status: "approved", label: "Approuvés", color: "text-accent-blue" },
                { status: "scheduled", label: "Programmés", color: "text-accent-blue" },
                { status: "in_review", label: "En révision / Soumis", color: "text-accent-amber" },
                { status: "revision_requested", label: "Révisions demandées", color: "text-accent-amber" },
                { status: "draft", label: "Brouillons", color: "text-muted" },
                { status: "rejected", label: "Rejetés", color: "text-red-500" },
                { status: "archived", label: "Archivés", color: "text-muted" },
              ].map((row) => (
                <div key={row.status} className="flex items-center justify-between">
                  <dt className="font-label text-xs text-muted">{row.label}</dt>
                  <dd className={`font-headline text-xl font-extrabold ${row.color}`}>
                    {byStatus[row.status] || 0}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        {/* Translation */}
        <Card>
          <CardHeader>
            <h3 className="font-label text-xs font-extrabold uppercase text-foreground">
              Statut des traductions
            </h3>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <div className="flex items-center justify-between">
                <dt className="font-label text-xs text-muted">Articles EN publiés</dt>
                <dd className="font-headline text-2xl font-extrabold text-accent-blue">
                  {publishedEn}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="font-label text-xs text-muted">En révision</dt>
                <dd className="font-headline text-2xl font-extrabold text-accent-amber">
                  {translationQueue.in_review}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="font-label text-xs text-muted">Brouillons IA</dt>
                <dd className="font-headline text-2xl font-extrabold text-muted">
                  {translationQueue.generated_draft}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="font-label text-xs text-muted">Taux de succès</dt>
                <dd className="font-headline text-2xl font-extrabold text-accent-teal">
                  {translationSuccessRate}%
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Translation backlog */}
      {translationBacklog.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="font-label text-xs font-extrabold uppercase text-foreground">
              File d&apos;attente de traduction ({translationBacklog.length})
            </h3>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border-subtle">
              {translationBacklog.map((a) => (
                <li key={a.id as string} className="flex items-center justify-between py-2.5">
                  <span className="font-body text-sm text-foreground line-clamp-1 flex-1 pr-4">
                    {a.title as string}
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    {a.translationPriority ? (
                      <span className="rounded bg-accent-amber/10 px-1.5 py-0.5 font-label text-[10px] font-bold uppercase text-accent-amber">
                        {String(a.translationPriority)}
                      </span>
                    ) : null}
                    <Link
                      href={`/admin/articles/${a.id as string}/edit`}
                      className="font-label text-xs text-primary hover:underline"
                    >
                      Éditer
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ── Author performance ────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <h3 className="font-label text-xs font-extrabold uppercase text-foreground">
            Performance par auteur
          </h3>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="pb-2 font-label text-[11px] font-extrabold uppercase text-muted">
                    Auteur
                  </th>
                  <th className="pb-2 pr-4 text-right font-label text-[11px] font-extrabold uppercase text-muted">
                    Total
                  </th>
                  <th className="pb-2 pr-4 text-right font-label text-[11px] font-extrabold uppercase text-muted">
                    Publiés
                  </th>
                  <th className="pb-2 pr-4 text-right font-label text-[11px] font-extrabold uppercase text-muted">
                    Vues totales
                  </th>
                  <th className="pb-2 text-right font-label text-[11px] font-extrabold uppercase text-muted">
                    Vues moy.
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {authorsWithNames.slice(0, 10).map((author) => (
                  <tr key={author.id} className="group">
                    <td className="py-2.5 font-body text-sm text-foreground">{author.name}</td>
                    <td className="py-2.5 pr-4 text-right font-label text-sm tabular-nums text-muted">
                      {author.count}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-label text-sm tabular-nums text-foreground">
                      {author.published}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-label text-sm tabular-nums text-foreground">
                      {author.views.toLocaleString("fr-FR")}
                    </td>
                    <td className="py-2.5 text-right font-label text-sm tabular-nums text-muted">
                      {author.avgViews.toLocaleString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Quick actions ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Quick publish */}
        <Card>
          <CardHeader>
            <h3 className="flex items-center gap-2 font-label text-xs font-extrabold uppercase text-foreground">
              <Clock className="h-3.5 w-3.5 text-accent-amber" />
              Publication rapide
            </h3>
          </CardHeader>
          <CardContent>
            {pendingArticles.length === 0 ? (
              <EmptyState icon={CheckCircle} title="Aucun article en attente" description="Aucune review ni révision n'est en souffrance." />
            ) : (
              <ul className="divide-y divide-border-subtle">
                {pendingArticles.map((a) => (
                  <li key={a.id as string} className="flex items-center justify-between py-2">
                    <span className="font-body text-xs text-foreground line-clamp-1 flex-1 pr-2">
                      {a.title as string}
                    </span>
                    <Link
                      href={`/admin/articles/${a.id as string}/edit`}
                      className="shrink-0 rounded-sm bg-primary px-2 py-1 font-label text-[10px] font-bold uppercase text-white hover:bg-primary-dark"
                    >
                      Réviser
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/dashboard/review"
              className="mt-3 block font-label text-xs text-primary hover:underline"
            >
              Voir tout →
            </Link>
          </CardContent>
        </Card>

        {/* Featured article */}
        <Card>
          <CardHeader>
            <h3 className="flex items-center gap-2 font-label text-xs font-extrabold uppercase text-foreground">
              <Star className="h-3.5 w-3.5 text-accent-amber" />
              Article à la une
            </h3>
          </CardHeader>
          <CardContent>
            {featured ? (
              <div className="space-y-2">
                <p className="font-body text-sm font-semibold text-foreground line-clamp-2">
                  {featured.title as string}
                </p>
                <div className="flex items-center gap-3 font-label text-xs text-muted">
                  <span>{((featured.views as number) || 0).toLocaleString("fr-FR")} vues</span>
                  {featured.publishedAt ? (
                    <span>
                      {format(new Date(featured.publishedAt as string), "d MMM yyyy", {
                        locale: fr,
                      })}
                    </span>
                  ) : null}
                </div>
                <Link
                  href={`/admin/articles/${featured.id as string}/edit`}
                  className="font-label text-xs text-primary hover:underline"
                >
                  Modifier →
                </Link>
              </div>
            ) : (
              <EmptyState icon={Star} title="Aucun article en avant" description="Sélectionnez un article à épingler depuis sa fiche." />
            )}
          </CardContent>
        </Card>

        {/* Quick create */}
        <Card>
          <CardHeader>
            <h3 className="font-label text-xs font-extrabold uppercase text-foreground">
              Création rapide
            </h3>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Link
                href="/admin/articles/new"
                className="flex items-center gap-2 rounded-sm border border-border-subtle bg-surface-elevated px-3 py-2.5 font-label text-xs font-bold text-foreground transition-colors hover:bg-surface"
              >
                <FileText className="h-4 w-4 text-primary" />
                Nouvel article
              </Link>
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-2 rounded-sm border border-border-subtle bg-surface-elevated px-3 py-2.5 font-label text-xs font-bold text-foreground transition-colors hover:bg-surface"
              >
                <AlertCircle className="h-4 w-4 text-accent-blue" />
                Gérer les catégories
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
