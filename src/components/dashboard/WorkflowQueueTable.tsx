"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getEditorialStatusLabel, getEditorialStatusVariant } from "@/lib/editorial-workflow";

interface QueueArticle {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  submittedForReviewAt?: string | null;
  approvedAt?: string | null;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  views?: number;
  language?: "fr" | "en";
  category?: { name: string } | null;
  author?: { name: string | null } | null;
}

interface WorkflowQueueTableProps {
  title: string;
  subtitle: string;
  statuses: string[];
  dateField?: "updatedAt" | "submittedForReviewAt" | "approvedAt" | "scheduledAt" | "publishedAt";
  emptyMessage: string;
  queryParams?: Record<string, string | undefined>;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return format(new Date(value), "d MMM yyyy · HH:mm", { locale: fr });
}

export default function WorkflowQueueTable({
  title,
  subtitle,
  statuses,
  dateField = "updatedAt",
  emptyMessage,
  queryParams,
}: WorkflowQueueTableProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<QueueArticle[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const requests = statuses.map((status) =>
          {
            const search = new URLSearchParams({ status, take: "120" });
            for (const [key, value] of Object.entries(queryParams || {})) {
              if (value) search.set(key, value);
            }
            return fetch(`/api/articles?${search.toString()}`).then((res) => res.json());
          },
        );
        const responses = await Promise.all(requests);
        const next = responses.flatMap((res) => (Array.isArray(res.articles) ? res.articles : []));
        setArticles(next as QueueArticle[]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [queryParams, statuses]);

  const sorted = useMemo(() => {
    return [...articles].sort((a, b) => {
      const aDate = new Date((a[dateField] as string | undefined) || a.updatedAt).getTime();
      const bDate = new Date((b[dateField] as string | undefined) || b.updatedAt).getTime();
      return bDate - aDate;
    });
  }, [articles, dateField]);

  return (
    <div className="space-y-5">
      <header>
        <p className="page-kicker mb-2">Workflow</p>
        <h1 className="font-headline text-5xl font-extrabold leading-none text-foreground">{title}</h1>
        <p className="mt-3 max-w-3xl font-body text-sm text-muted">{subtitle}</p>
      </header>

      <div className="overflow-hidden border border-border-subtle bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle bg-surface-newsprint">
              <th className="px-4 py-3 text-left font-label text-[11px] font-extrabold uppercase tracking-wide text-muted">
                Article
              </th>
              <th className="hidden px-4 py-3 text-left font-label text-[11px] font-extrabold uppercase tracking-wide text-muted md:table-cell">
                Auteur
              </th>
              <th className="hidden px-4 py-3 text-left font-label text-[11px] font-extrabold uppercase tracking-wide text-muted lg:table-cell">
                Rubrique
              </th>
              <th className="px-4 py-3 text-left font-label text-[11px] font-extrabold uppercase tracking-wide text-muted">
                Statut
              </th>
              <th className="hidden px-4 py-3 text-left font-label text-[11px] font-extrabold uppercase tracking-wide text-muted xl:table-cell">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {loading ? (
              Array.from({ length: 7 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="px-4 py-4">
                    <div className="h-4 animate-pulse rounded bg-surface-elevated" />
                  </td>
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center font-body text-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sorted.map((article) => (
                <tr
                  key={article.id}
                  className="cursor-pointer hover:bg-surface-newsprint"
                  onClick={() => router.push(`/dashboard/articles/${article.id}/edit`)}
                >
                  <td className="px-4 py-3">
                    <p className="line-clamp-1 font-body font-semibold text-foreground">{article.title}</p>
                    <p className="mt-0.5 font-label text-xs text-muted uppercase">{article.language || "fr"}</p>
                  </td>
                  <td className="hidden px-4 py-3 font-label text-xs text-muted md:table-cell">
                    {article.author?.name || "La rédaction"}
                  </td>
                  <td className="hidden px-4 py-3 font-label text-xs text-muted lg:table-cell">
                    {article.category?.name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={getEditorialStatusVariant(article.status)}>
                      {getEditorialStatusLabel(article.status)}
                    </Badge>
                  </td>
                  <td className="hidden px-4 py-3 font-label text-xs text-muted xl:table-cell">
                    {formatDate((article[dateField] as string | undefined) || article.updatedAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!loading && sorted.length > 0 ? (
          <div className="flex items-center justify-between border-t border-border-subtle px-4 py-3">
            <p className="font-label text-xs text-muted">
              {sorted.length} article{sorted.length > 1 ? "s" : ""}
            </p>
            <Link href="/dashboard/articles" className="font-label text-xs font-bold text-primary hover:underline">
              Ouvrir la liste complète
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
