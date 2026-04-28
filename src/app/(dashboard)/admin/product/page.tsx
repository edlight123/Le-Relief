import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDb, serializeTimestamps } from "@/lib/firebase";
import StatsCards from "@/components/dashboard/StatsCards";
import { TrafficLanguageBar } from "@/components/dashboard/EditorialCharts";
import Card, { CardHeader, CardContent } from "@/components/ui/Card";
import { Eye, Users, TrendingUp, BookOpen, Mail } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export default async function ProductDashboardPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || (role !== "admin" && role !== "publisher")) {
    redirect("/admin");
  }

  const db = getDb();
  const now = new Date();

  // Articles
  const articlesSnap = await db.collection("articles").get();
  const allArticles = articlesSnap.docs.map((d) =>
    serializeTimestamps({ id: d.id, ...d.data() } as Record<string, unknown>),
  );
  const published = allArticles.filter((a) => a.status === "published");
  const frPublished = published.filter((a) => a.language === "fr");
  const enPublished = published.filter((a) => a.language === "en");

  const totalViews = published.reduce((sum, a) => sum + ((a.views as number) || 0), 0);
  const frViews = frPublished.reduce((sum, a) => sum + ((a.views as number) || 0), 0);
  const enViews = enPublished.reduce((sum, a) => sum + ((a.views as number) || 0), 0);

  // Top articles
  const topArticles = [...published]
    .sort((a, b) => ((b.views as number) || 0) - ((a.views as number) || 0))
    .slice(0, 10);

  // Category views
  const byCategoryViews: Record<string, { views: number; count: number; name: string }> = {};
  for (const a of published) {
    const catId = (a.categoryId as string) || "uncategorized";
    if (!byCategoryViews[catId]) byCategoryViews[catId] = { views: 0, count: 0, name: catId };
    byCategoryViews[catId].views += (a.views as number) || 0;
    byCategoryViews[catId].count++;
  }
  const catIds = Object.keys(byCategoryViews).filter((id) => id !== "uncategorized");
  await Promise.all(
    catIds.map(async (id) => {
      const catSnap = await db.collection("categories").doc(id).get();
      if (catSnap.exists && byCategoryViews[id]) {
        byCategoryViews[id].name = (catSnap.data()?.name as string) || id;
      }
    }),
  );
  const categoryRanking = Object.values(byCategoryViews)
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);

  // Newsletter subscribers
  let totalSubscribers: number = 0;
  let signupsThisWeek: number = 0;
  let signupsThisMonth: number = 0;
  try {
    const subsSnap = await db.collection("subscriptions").get();
    const subs = subsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Record<string, unknown>));
    totalSubscribers = subs.length;
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(now);
    monthAgo.setDate(monthAgo.getDate() - 30);
    signupsThisWeek = subs.filter((s) => {
      const c = s.createdAt ? new Date(s.createdAt as string) : null;
      return c && c >= weekAgo;
    }).length;
    signupsThisMonth = subs.filter((s) => {
      const c = s.createdAt ? new Date(s.createdAt as string) : null;
      return c && c >= monthAgo;
    }).length;
  } catch {
    // subscriptions collection may not exist
  }

  const stats = [
    { label: "Vues totales", value: totalViews, icon: Eye, color: "blue" as const },
    { label: "Articles publiés", value: published.length, icon: BookOpen, color: "teal" as const },
    { label: "Vues FR", value: frViews, icon: TrendingUp, color: "teal" as const },
    { label: "Vues EN", value: enViews, icon: TrendingUp, color: "amber" as const },
    { label: "Abonnés newsletter", value: totalSubscribers, icon: Mail, color: "red" as const },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-headline text-3xl font-extrabold leading-none text-foreground">
          Métriques produit
        </h1>
        <p className="mt-1 font-label text-xs text-muted">
          {format(now, "EEEE d MMMM yyyy", { locale: fr })} · Données en temps réel
        </p>
      </div>

      <StatsCards stats={stats} />

      {/* Traffic by language */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="font-label text-xs font-extrabold uppercase text-foreground">
              Trafic FR vs EN (vues)
            </h3>
          </CardHeader>
          <CardContent>
            <TrafficLanguageBar frViews={frViews} enViews={enViews} />
            <div className="mt-3 grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="font-headline text-2xl font-extrabold text-accent-teal">
                  {totalViews > 0 ? Math.round((frViews / totalViews) * 100) : 0}%
                </p>
                <p className="font-label text-xs text-muted">Trafic français</p>
              </div>
              <div>
                <p className="font-headline text-2xl font-extrabold text-accent-blue">
                  {totalViews > 0 ? Math.round((enViews / totalViews) * 100) : 0}%
                </p>
                <p className="font-label text-xs text-muted">Trafic anglais</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Newsletter */}
        <Card>
          <CardHeader>
            <h3 className="flex items-center gap-2 font-label text-xs font-extrabold uppercase text-foreground">
              <Mail className="h-3.5 w-3.5 text-primary" />
              Newsletter
            </h3>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex items-center justify-between">
                <dt className="font-label text-xs text-muted">Total abonnés</dt>
                <dd className="font-headline text-3xl font-extrabold text-foreground">
                  {totalSubscribers.toLocaleString("fr-FR")}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="font-label text-xs text-muted">Inscriptions cette semaine</dt>
                <dd className="font-headline text-2xl font-extrabold text-accent-teal">+{signupsThisWeek}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="font-label text-xs text-muted">Inscriptions ce mois</dt>
                <dd className="font-headline text-2xl font-extrabold text-accent-blue">+{signupsThisMonth}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Top articles table */}
      <Card>
        <CardHeader>
          <h3 className="font-label text-xs font-extrabold uppercase text-foreground">
            Articles les plus vus
          </h3>
        </CardHeader>
        <CardContent>
          {topArticles.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Aucun article publié"
              description="Les articles publiés apparaîtront ici avec leurs métriques de vues."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="pb-2 font-label text-[11px] font-extrabold uppercase text-muted">Titre</th>
                    <th className="pb-2 pr-4 text-right font-label text-[11px] font-extrabold uppercase text-muted">Vues</th>
                    <th className="pb-2 pr-4 text-right font-label text-[11px] font-extrabold uppercase text-muted">Langue</th>
                    <th className="pb-2 text-right font-label text-[11px] font-extrabold uppercase text-muted">Publié le</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {topArticles.map((a) => (
                    <tr key={a.id as string}>
                      <td className="py-2.5 font-body text-sm text-foreground">
                        <span className="line-clamp-1 max-w-xs">{a.title as string}</span>
                      </td>
                      <td className="py-2.5 pr-4 text-right font-label text-sm tabular-nums text-foreground">
                        {((a.views as number) || 0).toLocaleString("fr-FR")}
                      </td>
                      <td className="py-2.5 pr-4 text-right">
                        <span className={`rounded px-1.5 py-0.5 font-label text-[10px] font-bold uppercase ${a.language === "fr" ? "bg-accent-teal/10 text-accent-teal" : "bg-accent-blue/10 text-accent-blue"}`}>
                          {a.language as string}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-label text-xs text-muted">
                        {a.publishedAt
                          ? format(new Date(a.publishedAt as string), "d MMM yyyy", { locale: fr })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category ranking */}
      <Card>
        <CardHeader>
          <h3 className="flex items-center gap-2 font-label text-xs font-extrabold uppercase text-foreground">
            <Users className="h-3.5 w-3.5 text-accent-blue" />
            Performance par catégorie
          </h3>
        </CardHeader>
        <CardContent>
          {categoryRanking.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Aucune donnée catégorie"
              description="Publiez des articles dans des catégories pour voir leur performance."
            />
          ) : (
            <div className="space-y-3">
              {categoryRanking.map((cat, i) => {
                const pct = categoryRanking[0]?.views ? Math.round((cat.views / categoryRanking[0].views) * 100) : 0;
                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-label text-xs text-foreground">
                        {i + 1}. {cat.name}
                      </span>
                      <span className="font-label text-xs tabular-nums text-muted">
                        {cat.views.toLocaleString("fr-FR")} vues · {cat.count} articles
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-surface-elevated">
                      <div
                        className="h-1.5 rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}