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
} from "@/components/dashboard/EditorialCharts";
import Card, { CardHeader, CardContent } from "@/components/ui/Card";
import { FileText, Globe, Languages, Star, AlertCircle, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const dynamic = "force-dynamic";
export const revalidate = 300;

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

export default async function EditorialDashboardPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || (role !== "admin" && role !== "publisher")) {
    redirect("/dashboard");
  }

  const db = getDb();

  // Fetch all articles
  const snap = await db.collection("articles").get();
  const allArticles = snap.docs.map((d) =>
    serializeTimestamps({ id: d.id, ...d.data() } as Record<string, unknown>),
  );

  const frArticles = allArticles.filter((a) => a.language === "fr");
  const enArticles = allArticles.filter((a) => a.language === "en");
  const publishedFr = frArticles.filter((a) => a.status === "published").length;
  const publishedEn = enArticles.filter((a) => a.status === "published").length;

  const byStatus = {
    draft: allArticles.filter((a) => a.status === "draft").length,
    pending_review: allArticles.filter((a) => a.status === "pending_review").length,
    published: allArticles.filter((a) => a.status === "published").length,
  };

  // Content type distribution
  const contentTypeCounts: Record<string, number> = {};
  for (const a of allArticles) {
    const ct = (a.contentType as string) || "actualite";
    contentTypeCounts[ct] = (contentTypeCounts[ct] || 0) + 1;
  }
  const contentTypeData = Object.entries(contentTypeCounts).map(([key, value]) => ({
    name: CONTENT_TYPE_LABELS[key] || key,
    value,
  }));

  // Category data
  const categoryCountsById: Record<string, number> = {};
  for (const a of allArticles) {
    const catId = (a.categoryId as string) || "uncategorized";
    categoryCountsById[catId] = (categoryCountsById[catId] || 0) + 1;
  }
  const catIds = Object.keys(categoryCountsById).filter((id) => id !== "uncategorized");
  const categoryNames: Record<string, string> = {};
  await Promise.all(
    catIds.map(async (id) => {
      const catSnap = await db.collection("categories").doc(id).get();
      if (catSnap.exists) {
        categoryNames[id] = (catSnap.data()?.name as string) || id;
      }
    }),
  );
  const categoryData = Object.entries(categoryCountsById)
    .map(([id, value]) => ({ name: categoryNames[id] || id, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Weekly velocity (last 12 weeks)
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
    weeklyVelocity.push({ week: `S${weekStart.getDate()}/${weekStart.getMonth() + 1}`, count });
  }

  // Translation stats
  const translationQueue = {
    in_review: enArticles.filter((a) => a.translationStatus === "in_review" || a.translationStatus === "pending_review").length,
    generated_draft: enArticles.filter((a) => a.translationStatus === "generated_draft").length,
    approved: enArticles.filter((a) => a.translationStatus === "approved").length,
  };
  const translationSuccessRate =
    enArticles.length > 0 ? Math.round((translationQueue.approved / enArticles.length) * 100) : 0;

  // Translation backlog
  const frAllowTranslation = frArticles.filter((a) => a.allowTranslation === true && a.status === "published");
  const enSourceIds = new Set(enArticles.map((a) => a.sourceArticleId as string).filter(Boolean));
  const translationBacklog = frAllowTranslation
    .filter((a) => !enSourceIds.has(a.id as string))
    .slice(0, 10);

  // Author performance
  const authorStats: Record<string, { count: number; views: number }> = {};
  for (const a of allArticles) {
    const authorId = (a.authorId as string) || "unknown";
    if (!authorStats[authorId]) authorStats[authorId] = { count: 0, views: 0 };
    authorStats[authorId].count++;
    authorStats[authorId].views += (a.views as number) || 0;
  }
  const authorIds = Object.keys(authorStats);
  const authorsWithNames = await Promise.all(
    authorIds.map(async (id) => {
      const user = await usersRepo.getUser(id);
      return {
        id,
        name: (user?.name as string) || "Inconnu",
        ...authorStats[id]!,
        avgViews: authorStats[id]!.count > 0 ? Math.round(authorStats[id]!.views / authorStats[id]!.count) : 0,
      };
    }),
  );
  authorsWithNames.sort((a, b) => b.count - a.count);

  // Pending articles (for quick publish)
  const { articles: pendingArticles } = await articlesRepo.getArticles({ status: "pending_review", take: 5 });

  // Featured article
  const featured = await articlesRepo.getFeaturedArticle();

  // Stats cards
  const stats = [
    { label: "Total articles", value: allArticles.length, icon: FileText, color: "blue" as const },
    { label: "Publiés FR", value: publishedFr, icon: Globe, color: "teal" as const },
    { label: "Publiés EN", value: publishedEn, icon: Languages, color: "amber" as const },
    { label: "En attente", value: byStatus.pending_review, icon: Clock, color: "amber" as const },
    { label: "Brouillons", value: byStatus.draft, icon: FileText, color: "red" as const },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-3xl font-extrabold leading-none text-foreground">
            Rapport éditorial
          </h1>
          <p className="mt-1 font-label text-xs text-muted">
            {format(now, "EEEE d MMMM yyyy", { locale: fr })} · Données en temps réel
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/articles/new"
            className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 font-label text-xs font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-primary-dark"
          >
            Nouvel article
          </Link>
          <Link
            href="/dashboard/editorial/export"
            className="inline-flex items-center gap-2 rounded-sm border border-border-subtle bg-surface px-4 py-2 font-label text-xs font-extrabold uppercase tracking-wide text-foreground transition-colors hover:bg-surface-elevated"
          >
            Exporter CSV
          </Link>
        </div>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Weekly velocity */}
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

        {/* Content types */}
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
                <span key={item.name} className="flex items-center gap-1 font-label text-[11px] text-muted">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: ["#c0392b","#16a34a","#2563eb","#d97706","#8b5cf6","#ec4899","#14b8a6","#f97316"][i % 8] }}
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

      {/* Status breakdown + Translation */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Status */}
        <Card>
          <CardHeader>
            <h3 className="font-label text-xs font-extrabold uppercase text-foreground">
              Statuts des articles
            </h3>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              {[
                { label: "Publiés", value: byStatus.published, color: "text-accent-teal" },
                { label: "En attente de révision", value: byStatus.pending_review, color: "text-accent-amber" },
                { label: "Brouillons", value: byStatus.draft, color: "text-muted" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <dt className="font-label text-xs text-muted">{row.label}</dt>
                  <dd className={`font-headline text-2xl font-extrabold ${row.color}`}>{row.value}</dd>
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
                <dd className="font-headline text-2xl font-extrabold text-accent-blue">{publishedEn}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="font-label text-xs text-muted">En révision</dt>
                <dd className="font-headline text-2xl font-extrabold text-accent-amber">{translationQueue.in_review}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="font-label text-xs text-muted">Brouillons IA</dt>
                <dd className="font-headline text-2xl font-extrabold text-muted">{translationQueue.generated_draft}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="font-label text-xs text-muted">Taux de succès</dt>
                <dd className="font-headline text-2xl font-extrabold text-accent-teal">{translationSuccessRate}%</dd>
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
                      href={`/dashboard/articles/${a.id as string}/edit`}
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

      {/* Author performance table */}
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
                  <th className="pb-2 font-label text-[11px] font-extrabold uppercase text-muted">Auteur</th>
                  <th className="pb-2 pr-4 text-right font-label text-[11px] font-extrabold uppercase text-muted">Articles</th>
                  <th className="pb-2 pr-4 text-right font-label text-[11px] font-extrabold uppercase text-muted">Vues totales</th>
                  <th className="pb-2 text-right font-label text-[11px] font-extrabold uppercase text-muted">Vues moy.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {authorsWithNames.slice(0, 10).map((author) => (
                  <tr key={author.id} className="group">
                    <td className="py-2.5 font-body text-sm text-foreground">{author.name}</td>
                    <td className="py-2.5 pr-4 text-right font-label text-sm tabular-nums text-foreground">{author.count}</td>
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

      {/* Quick Publish + Featured + Alerts row */}
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
              <div className="flex items-center gap-2 py-4 text-muted">
                <CheckCircle className="h-4 w-4 text-accent-teal" />
                <span className="font-label text-xs">Aucun article en attente</span>
              </div>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {pendingArticles.map((a) => (
                  <li key={a.id as string} className="flex items-center justify-between py-2">
                    <span className="font-body text-xs text-foreground line-clamp-1 flex-1 pr-2">
                      {a.title as string}
                    </span>
                    <Link
                      href={`/dashboard/articles/${a.id as string}/edit`}
                      className="shrink-0 rounded-sm bg-primary px-2 py-1 font-label text-[10px] font-bold uppercase text-white hover:bg-primary-dark"
                    >
                      Réviser
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/dashboard/articles?status=pending_review"
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
                  <span>{(featured.views as number || 0).toLocaleString("fr-FR")} vues</span>
                  {featured.publishedAt ? (
                    <span>
                      {format(new Date(featured.publishedAt as string), "d MMM yyyy", { locale: fr })}
                    </span>
                  ) : null}
                </div>
                <Link
                  href={`/dashboard/articles/${featured.id as string}/edit`}
                  className="font-label text-xs text-primary hover:underline"
                >
                  Modifier →
                </Link>
              </div>
            ) : (
              <p className="py-4 font-label text-xs text-muted">Aucun article mis en avant</p>
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
                href="/dashboard/articles/new"
                className="flex items-center gap-2 rounded-sm border border-border-subtle bg-surface-elevated px-3 py-2.5 font-label text-xs font-bold text-foreground transition-colors hover:bg-surface"
              >
                <FileText className="h-4 w-4 text-primary" />
                Nouvel article
              </Link>
              <Link
                href="/dashboard/categories/new"
                className="flex items-center gap-2 rounded-sm border border-border-subtle bg-surface-elevated px-3 py-2.5 font-label text-xs font-bold text-foreground transition-colors hover:bg-surface"
              >
                <AlertCircle className="h-4 w-4 text-accent-blue" />
                Nouvelle catégorie
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
