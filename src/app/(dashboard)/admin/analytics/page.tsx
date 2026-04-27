"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Eye,
  Languages,
  Mail,
  Search,
  TrendingUp,
  Workflow,
  Zap,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import FilterBar, { FilterBarSection } from "@/components/ui/FilterBar";
import PageHeader from "@/components/ui/PageHeader";
import StatusChip from "@/components/ui/StatusChip";

interface SummaryData {
  period: { startDate: string; endDate: string; days: number };
  summary: {
    totalViews: number;
    uniqueSessions: number;
    viewsByLanguage: { fr: number; en: number };
    totalSearches: number;
    zeroResultSearches: number;
    zeroResultRate: number;
    newsletterSignups: number;
    newsletterConversions: number;
    languageSwitches: number;
  };
  language: {
    frViewCount: number;
    enViewCount: number;
    frPercentage: number;
    enPercentage: number;
    languageSwitches: number;
  };
}

interface Article {
  articleId: string;
  title: string;
  slug: string;
  language: "fr" | "en";
  category?: string;
  viewCount: number;
}

interface SearchQuery {
  query: string;
  count: number;
  zeroResultCount: number;
  zeroResultRate: string;
}

interface NewsletterMetrics {
  period: { startDate: string; endDate: string; days: number };
  summary: {
    signups: number;
    failures: number;
    conversionRate: number;
    total: number;
  };
  byEmailDomain: Record<string, number>;
  bySource: Record<string, number>;
}

interface LanguageMetrics {
  period: { startDate: string; endDate: string; days: number };
  usage: {
    frViewCount: number;
    enViewCount: number;
    frPercentage: number;
    enPercentage: number;
    total: number;
  };
  languageSwitches: number;
}

interface EditorialKpis {
  generatedAt: string;
  statusBreakdown: Record<string, number>;
  breakingCount: number;
  homepagePinnedCount: number;
  totalArticles: number;
  workflow: {
    avgDraftToReviewHours: number | null;
    avgReviewToApprovedHours: number | null;
    avgApprovedToPublishedHours: number | null;
    revisionRate: number;
    totalArticlesSubmitted: number;
    totalRevised: number;
  };
  blockedArticles: Array<{
    articleId: string;
    title: string;
    status: string;
    blockingCount: number;
  }>;
  dailyPublicationRate: Array<{
    date: string;
    count: number;
  }>;
}

function formatMetric(value: number | string) {
  return typeof value === "number" ? value.toLocaleString("fr-FR") : value;
}

function StatCard({
  label,
  value,
  icon,
  helper,
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
  helper?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-label text-xs font-bold uppercase text-muted">{label}</p>
            <p className="mt-2 font-headline text-3xl font-extrabold text-foreground">
              {formatMetric(value)}
            </p>
            {helper ? <p className="mt-2 text-xs text-muted">{helper}</p> : null}
          </div>
          <div className="text-primary/30">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatHours(value: number | null) {
  if (value === null) return "—";
  if (value < 24) return `${value.toFixed(1)} h`;
  return `${(value / 24).toFixed(1)} j`;
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [language, setLanguage] = useState<"fr" | "en" | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchQueries, setSearchQueries] = useState<SearchQuery[]>([]);
  const [newsletter, setNewsletter] = useState<NewsletterMetrics | null>(null);
  const [languageMetrics, setLanguageMetrics] = useState<LanguageMetrics | null>(null);
  const [editorialKpis, setEditorialKpis] = useState<EditorialKpis | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [summaryRes, articlesRes, searchRes, newsletterRes, langRes, editorialRes] =
        await Promise.all([
          fetch(`/api/analytics/summary?days=${days}&language=${language}`),
          fetch(`/api/analytics/articles?days=${days}&language=${language}&take=10`),
          fetch(`/api/analytics/search?days=${days}&language=${language}&take=10`),
          fetch(`/api/analytics/newsletter?days=${days}&language=${language}`),
          fetch(`/api/analytics/language?days=${days}`),
          fetch(`/api/analytics/editorial-kpis`),
        ]);

      if (!summaryRes.ok || !articlesRes.ok || !searchRes.ok || !newsletterRes.ok || !langRes.ok || !editorialRes.ok) {
        throw new Error("Impossible de charger toutes les métriques analytiques.");
      }

      const [summaryData, articlesData, searchData, newsletterData, languageData, editorialData] =
        await Promise.all([
          summaryRes.json(),
          articlesRes.json(),
          searchRes.json(),
          newsletterRes.json(),
          langRes.json(),
          editorialRes.json(),
        ]);

      setSummary(summaryData);
      setArticles(articlesData.articles || []);
      setSearchQueries(searchData.queries || []);
      setNewsletter(newsletterData);
      setLanguageMetrics(languageData);
      setEditorialKpis(editorialData);
    } catch (fetchError) {
      console.error("Failed to fetch analytics:", fetchError);
      setError(fetchError instanceof Error ? fetchError.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }, [days, language]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const publicationTrend = useMemo(
    () => editorialKpis?.dailyPublicationRate || [],
    [editorialKpis],
  );
  const languagePieData = useMemo(
    () =>
      languageMetrics
        ? [
            { name: "Français", value: languageMetrics.usage.frPercentage },
            { name: "English", value: languageMetrics.usage.enPercentage },
          ]
        : [],
    [languageMetrics],
  );
  const statusBreakdownEntries = useMemo(
    () => Object.entries(editorialKpis?.statusBreakdown || {}).sort(([, a], [, b]) => b - a),
    [editorialKpis],
  );
  const totalPublications = useMemo(
    () => publicationTrend.reduce((sum, point) => sum + point.count, 0),
    [publicationTrend],
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader
          kicker="Mesure"
          title="Analytique"
          description="Suivi audience, recherche, infolettre et performance du flux éditorial."
        />
        <Card>
          <CardContent className="py-12 text-center text-muted">Chargement des données...</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Mesure"
        title="Analytique"
        description="Vue consolidée de l’audience, des conversions et des goulots éditoriaux pour piloter la rédaction."
        badges={
          <>
            <Badge variant="default">Fenêtre {days} jours</Badge>
            <Badge variant="default">Langue {language === "all" ? "toutes" : language.toUpperCase()}</Badge>
            {editorialKpis ? <Badge variant="info">Pipeline éditorial actif</Badge> : null}
          </>
        }
      />

      <FilterBar>
        <FilterBarSection>
          {[7, 30, 90].map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setDays(range)}
              className={`px-3 py-2 font-label text-xs font-bold uppercase transition-colors ${
                days === range
                  ? "bg-primary text-white"
                  : "border border-border-subtle text-foreground hover:bg-surface-elevated"
              }`}
            >
              {range} jours
            </button>
          ))}
        </FilterBarSection>
        <FilterBarSection className="sm:ml-auto">
          {(["fr", "en", "all"] as const).map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => setLanguage(locale)}
              className={`px-3 py-2 font-label text-xs font-bold uppercase transition-colors ${
                language === locale
                  ? "bg-primary text-white"
                  : "border border-border-subtle text-foreground hover:bg-surface-elevated"
              }`}
            >
              {locale === "all" ? "Toutes" : locale.toUpperCase()}
            </button>
          ))}
        </FilterBarSection>
      </FilterBar>

      {error ? (
        <Card>
          <CardContent className="py-10 text-center">
            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-danger" />
            <p className="font-label text-sm font-bold text-foreground">Chargement impossible</p>
            <p className="mt-1 text-xs text-muted">{error}</p>
          </CardContent>
        </Card>
      ) : null}

      {summary ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard
            label="Vues totales"
            value={summary.summary.totalViews}
            icon={<Eye className="h-8 w-8" />}
          />
          <StatCard
            label="Sessions uniques"
            value={summary.summary.uniqueSessions}
            icon={<TrendingUp className="h-8 w-8" />}
          />
          <StatCard
            label="Recherches"
            value={summary.summary.totalSearches}
            icon={<Search className="h-8 w-8" />}
            helper={`${summary.summary.zeroResultRate.toFixed(1)}% sans résultat`}
          />
          <StatCard
            label="Inscriptions NL"
            value={summary.summary.newsletterSignups}
            icon={<Mail className="h-8 w-8" />}
          />
          <StatCard
            label="Switch langue"
            value={summary.summary.languageSwitches}
            icon={<Languages className="h-8 w-8" />}
          />
          <StatCard
            label="Articles épinglés"
            value={editorialKpis?.homepagePinnedCount || 0}
            icon={<Zap className="h-8 w-8" />}
            helper={`${editorialKpis?.breakingCount || 0} breaking actifs`}
          />
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-label text-xs font-extrabold uppercase text-muted">Cadence éditoriale</p>
                <h3 className="mt-1 font-headline text-2xl font-extrabold text-foreground">
                  Publications quotidiennes
                </h3>
              </div>
              <Badge variant="default">{totalPublications} publiées</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {publicationTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={publicationTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                  <XAxis dataKey="date" stroke="var(--color-muted)" />
                  <YAxis allowDecimals={false} stroke="var(--color-muted)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-surface-elevated)",
                      border: "1px solid var(--color-border-subtle)",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Publications"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon={TrendingUp}
                title="Pas encore de tendance exploitable"
                description="Aucune publication n’a été relevée sur la période sélectionnée."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-label text-xs font-extrabold uppercase text-muted">Pipeline</p>
                <h3 className="mt-1 font-headline text-2xl font-extrabold text-foreground">
                  Goulots éditoriaux
                </h3>
              </div>
              <Workflow className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="border border-border-subtle p-4">
                <p className="font-label text-xs font-bold uppercase text-muted">Brouillon → revue</p>
                <p className="mt-2 font-headline text-2xl font-extrabold text-foreground">
                  {formatHours(editorialKpis?.workflow.avgDraftToReviewHours ?? null)}
                </p>
              </div>
              <div className="border border-border-subtle p-4">
                <p className="font-label text-xs font-bold uppercase text-muted">Revue → approbation</p>
                <p className="mt-2 font-headline text-2xl font-extrabold text-foreground">
                  {formatHours(editorialKpis?.workflow.avgReviewToApprovedHours ?? null)}
                </p>
              </div>
              <div className="border border-border-subtle p-4">
                <p className="font-label text-xs font-bold uppercase text-muted">Approbation → publication</p>
                <p className="mt-2 font-headline text-2xl font-extrabold text-foreground">
                  {formatHours(editorialKpis?.workflow.avgApprovedToPublishedHours ?? null)}
                </p>
              </div>
              <div className="border border-border-subtle p-4">
                <p className="font-label text-xs font-bold uppercase text-muted">Taux de révision</p>
                <p className="mt-2 font-headline text-2xl font-extrabold text-foreground">
                  {editorialKpis?.workflow.revisionRate ?? 0}%
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="default">
                {editorialKpis?.workflow.totalArticlesSubmitted ?? 0} articles passés en revue
              </Badge>
              <Badge variant="warning">
                {editorialKpis?.workflow.totalRevised ?? 0} articles révisés
              </Badge>
              <Badge variant={(editorialKpis?.blockedArticles.length || 0) > 0 ? "danger" : "success"}>
                {(editorialKpis?.blockedArticles.length || 0)} blocages ouverts
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <h3 className="font-label text-xs font-extrabold uppercase text-foreground">
              Répartition des langues
            </h3>
          </CardHeader>
          <CardContent className="p-6">
            {languagePieData.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={languagePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={72} label>
                      <Cell fill="#2563eb" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-surface-elevated)",
                        border: "1px solid var(--color-border-subtle)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Français</span>
                    <span className="font-bold text-foreground">
                      {languageMetrics?.usage.frPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Anglais</span>
                    <span className="font-bold text-foreground">
                      {languageMetrics?.usage.enPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border-subtle pt-2">
                    <span className="text-muted">Changements de langue</span>
                    <span className="font-bold text-foreground">
                      {languageMetrics?.languageSwitches ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={Languages}
                title="Pas de données de langue"
                description="Les variations FR/EN apparaîtront dès que le trafic sera consolidé."
              />
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader>
            <h3 className="font-label text-xs font-extrabold uppercase text-foreground">
              Statuts éditoriaux
            </h3>
          </CardHeader>
          <CardContent className="space-y-3 p-6">
            {statusBreakdownEntries.length > 0 ? (
              statusBreakdownEntries.map(([status, count]) => (
                <div key={status} className="flex items-center justify-between gap-3 border-b border-border-subtle pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <StatusChip status={status} />
                  </div>
                  <span className="font-label text-sm font-bold text-foreground">{count}</span>
                </div>
              ))
            ) : (
              <EmptyState
                icon={Workflow}
                title="Aucun statut disponible"
                description="Les compteurs éditoriaux seront visibles une fois le pipeline alimenté."
              />
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader>
            <h3 className="font-label text-xs font-extrabold uppercase text-foreground">
              Infolettre
            </h3>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {newsletter ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-label text-xs font-bold uppercase text-muted">Inscriptions</p>
                    <p className="mt-2 font-headline text-2xl font-extrabold text-foreground">
                      {newsletter.summary.signups}
                    </p>
                  </div>
                  <div>
                    <p className="font-label text-xs font-bold uppercase text-muted">Conversion</p>
                    <p className="mt-2 font-headline text-2xl font-extrabold text-foreground">
                      {newsletter.summary.conversionRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div>
                  <p className="mb-2 font-label text-xs font-bold uppercase text-muted">Domaines populaires</p>
                  <div className="space-y-2 text-sm">
                    {Object.entries(newsletter.byEmailDomain)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([domain, count]) => (
                        <div key={domain} className="flex items-center justify-between gap-3">
                          <span className="truncate text-muted">{domain}</span>
                          <span className="font-bold text-foreground">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                icon={Mail}
                title="Aucune inscription récente"
                description="Les conversions d’infolettre apparaîtront ici dès qu’elles seront enregistrées."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="font-label text-xs font-extrabold uppercase text-foreground">
                Articles les plus lus
              </h3>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {articles.length > 0 ? (
              <ol>
                {articles.map((article, index) => (
                  <li
                    key={article.articleId}
                    className="flex items-center gap-4 border-b border-border-subtle px-6 py-4 last:border-0"
                  >
                    <span className="w-6 font-label text-xs font-extrabold text-muted">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-body text-sm font-medium text-foreground">{article.title}</p>
                      <p className="mt-1 text-xs text-muted">
                        {article.language === "fr" ? "Français" : "English"}
                        {article.category ? ` • ${article.category}` : ""}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 font-label text-xs font-bold text-muted">
                      <Eye className="h-3 w-3" />
                      {article.viewCount}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="p-6">
                <EmptyState
                  icon={TrendingUp}
                  title="Aucun article populaire"
                  description="Les contenus les plus lus apparaîtront dès que des vues seront consolidées."
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              <h3 className="font-label text-xs font-extrabold uppercase text-foreground">
                Requêtes de recherche
              </h3>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {searchQueries.length > 0 ? (
              <ol>
                {searchQueries.map((query, index) => (
                  <li
                    key={query.query}
                    className="flex items-center gap-4 border-b border-border-subtle px-6 py-4 last:border-0"
                  >
                    <span className="w-6 font-label text-xs font-extrabold text-muted">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-body text-sm font-medium text-foreground">{query.query}</p>
                      <p className="mt-1 text-xs text-muted">
                        {query.zeroResultCount > 0
                          ? `${query.zeroResultCount} résultats vides (${query.zeroResultRate}%)`
                          : "Aucun résultat vide signalé"}
                      </p>
                    </div>
                    <span className="font-label text-xs font-bold text-muted">{query.count}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="p-6">
                <EmptyState
                  icon={Search}
                  title="Aucune requête remontée"
                  description="Les recherches les plus fréquentes apparaîtront ici lorsqu’elles seront disponibles."
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-label text-xs font-extrabold uppercase text-muted">Blocages</p>
              <h3 className="mt-1 font-headline text-2xl font-extrabold text-foreground">
                Articles à débloquer
              </h3>
            </div>
            <Badge variant={(editorialKpis?.blockedArticles.length || 0) > 0 ? "danger" : "success"}>
              {(editorialKpis?.blockedArticles.length || 0)} ouverts
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {editorialKpis && editorialKpis.blockedArticles.length > 0 ? (
            <ol>
              {editorialKpis.blockedArticles.map((article) => (
                <li
                  key={article.articleId}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-6 py-4 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-sm font-medium text-foreground">{article.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusChip status={article.status} />
                      <Badge variant="danger">{article.blockingCount} commentaires bloquants</Badge>
                    </div>
                  </div>
                  <span className="font-label text-xs font-bold uppercase text-muted">{article.articleId}</span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="p-6">
              <EmptyState
                icon={AlertTriangle}
                title="Aucun blocage ouvert"
                description="Les commentaires éditoriaux bloquants apparaîtront ici pour accélérer le traitement."
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
