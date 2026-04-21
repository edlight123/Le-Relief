"use client";

import { useState, useEffect } from "react";
import { subDays, format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Calendar, TrendingUp, Search, Eye, Mail, Zap } from "lucide-react";
import Card, { CardHeader, CardContent } from "@/components/ui/Card";

// Types
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

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [language, setLanguage] = useState<"fr" | "en" | "all">("all");
  const [loading, setLoading] = useState(true);

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchQueries, setSearchQueries] = useState<SearchQuery[]>([]);
  const [newsletter, setNewsletter] = useState<NewsletterMetrics | null>(null);
  const [languageMetrics, setLanguageMetrics] = useState<LanguageMetrics | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [days, language]);

  async function fetchData() {
    setLoading(true);
    try {
      const [summaryRes, articlesRes, searchRes, newsletterRes, langRes] =
        await Promise.all([
          fetch(`/api/analytics/summary?days=${days}&language=${language}`),
          fetch(`/api/analytics/articles?days=${days}&language=${language}&take=10`),
          fetch(`/api/analytics/search?days=${days}&language=${language}&take=10`),
          fetch(`/api/analytics/newsletter?days=${days}&language=${language}`),
          fetch(`/api/analytics/language?days=${days}`),
        ]);

      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (articlesRes.ok) {
        const data = await articlesRes.json();
        setArticles(data.articles || []);
      }
      if (searchRes.ok) {
        const data = await searchRes.json();
        setSearchQueries(data.queries || []);
      }
      if (newsletterRes.ok) setNewsletter(await newsletterRes.json());
      if (langRes.ok) setLanguageMetrics(await langRes.json());

      // Generate mock time-series data (would come from actual API in production)
      generateChartData();
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  function generateChartData() {
    const now = new Date();
    const data = [];
    for (let i = Math.min(days, 30) - 1; i >= 0; i--) {
      const date = subDays(now, i);
      data.push({
        date: format(date, "MMM d", { locale: enUS }),
        FR: Math.floor(Math.random() * 50) + 10,
        EN: Math.floor(Math.random() * 40) + 5,
        total: 0,
      });
    }
    data.forEach((d) => (d.total = d.FR + d.EN));
    setChartData(data);
  }

  const StatCard = ({
    label,
    value,
    icon: Icon,
  }: {
    label: string;
    value: number | string;
    icon: React.ReactNode;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-label text-xs font-bold uppercase text-muted">
              {label}
            </p>
            <p className="font-headline text-3xl font-extrabold text-foreground">
              {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
            </p>
          </div>
          <div className="text-primary/30">{Icon}</div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <header className="border-t-2 border-border-strong pt-4">
          <p className="page-kicker mb-2">Mesure</p>
          <h1 className="font-headline text-5xl font-extrabold leading-none text-foreground">
            Analytiques
          </h1>
        </header>
        <div className="text-center py-12">
          <p className="text-muted">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="border-t-2 border-border-strong pt-4">
        <p className="page-kicker mb-2">Mesure</p>
        <h1 className="font-headline text-5xl font-extrabold leading-none text-foreground">
          Analytiques
        </h1>
      </header>

      {/* Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3 py-2 text-xs font-bold transition-colors ${
                    days === d
                      ? "bg-primary text-white"
                      : "border border-border-subtle hover:bg-surface-elevated"
                  }`}
                >
                  {d} jours
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {(["fr", "en", "all"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className={`px-3 py-2 text-xs font-bold transition-colors ${
                    language === l
                      ? "bg-primary text-white"
                      : "border border-border-subtle hover:bg-surface-elevated"
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
          />
          <StatCard
            label="Inscriptions NL"
            value={summary.summary.newsletterSignups}
            icon={<Mail className="h-8 w-8" />}
          />
          <StatCard
            label="Changements langue"
            value={summary.summary.languageSwitches}
            icon={<Zap className="h-8 w-8" />}
          />
        </div>
      )}

      {/* Views Over Time Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="font-label text-xs font-extrabold uppercase text-foreground">
              Vues par jour
            </h3>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                <XAxis dataKey="date" stroke="var(--color-muted)" />
                <YAxis stroke="var(--color-muted)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-surface-elevated)",
                    border: "1px solid var(--color-border-subtle)",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="FR"
                  stroke="#3b82f6"
                  name="Français"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="EN"
                  stroke="#ef4444"
                  name="Anglais"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Language Usage */}
        {languageMetrics && (
          <Card>
            <CardHeader>
              <h3 className="font-label text-xs font-extrabold uppercase text-foreground">
                Utilisation des langues
              </h3>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: "Français",
                          value: languageMetrics.usage.frPercentage,
                        },
                        { name: "English", value: languageMetrics.usage.enPercentage },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      label
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#ef4444" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Français</span>
                    <span className="font-bold text-foreground">
                      {languageMetrics.usage.frPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Anglais</span>
                    <span className="font-bold text-foreground">
                      {languageMetrics.usage.enPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border-subtle pt-2">
                    <span className="text-muted">Changements de langue</span>
                    <span className="font-bold text-foreground">
                      {languageMetrics.languageSwitches}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Newsletter Metrics */}
        {newsletter && (
          <Card>
            <CardHeader>
              <h3 className="font-label text-xs font-extrabold uppercase text-foreground">
                Infolettre
              </h3>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-label text-xs font-bold uppercase text-muted">
                      Inscriptions
                    </p>
                    <p className="font-headline text-2xl font-extrabold text-foreground">
                      {newsletter.summary.signups}
                    </p>
                  </div>
                  <div>
                    <p className="font-label text-xs font-bold uppercase text-muted">
                      Taux de conversion
                    </p>
                    <p className="font-headline text-2xl font-extrabold text-foreground">
                      {newsletter.summary.conversionRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div>
                  <p className="font-label text-xs font-bold uppercase text-muted mb-2">
                    Domaines populaires
                  </p>
                  <div className="space-y-1 text-sm">
                    {Object.entries(newsletter.byEmailDomain)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([domain, count]) => (
                        <div key={domain} className="flex justify-between">
                          <span className="text-muted truncate">{domain}</span>
                          <span className="font-bold text-foreground">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Articles */}
      {articles.length > 0 && (
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
            <ol>
              {articles.map((article, index) => (
                <li
                  key={article.articleId}
                  className="flex items-center gap-4 border-b border-border-subtle px-6 py-3 last:border-0"
                >
                  <span className="w-6 font-label text-xs font-extrabold text-muted">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-sm font-medium text-foreground">
                      {article.title}
                    </p>
                    <p className="text-xs text-muted">
                      {article.language === "fr" ? "Français" : "English"} {article.category ? `• ${article.category}` : ""}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 font-label text-xs font-bold text-muted">
                    <Eye className="h-3 w-3" />
                    {article.viewCount}
                  </span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Top Search Queries */}
      {searchQueries.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              <h3 className="font-label text-xs font-extrabold uppercase text-foreground">
                Requêtes de recherche populaires
              </h3>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ol>
              {searchQueries.map((query, index) => (
                <li
                  key={query.query}
                  className="flex items-center gap-4 border-b border-border-subtle px-6 py-3 last:border-0"
                >
                  <span className="w-6 font-label text-xs font-extrabold text-muted">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-sm font-medium text-foreground">
                      {query.query}
                    </p>
                    <p className="text-xs text-muted">
                      {query.zeroResultCount > 0 && `${query.zeroResultCount} résultats vides (${query.zeroResultRate}%)`}
                    </p>
                  </div>
                  <span className="font-label text-xs font-bold text-muted">
                    {query.count}
                  </span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
