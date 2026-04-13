import Badge from "@/components/ui/Badge";
import Table, { type Column } from "@/components/ui/Table";
import { format } from "date-fns";

interface Article {
  id: string;
  title: string;
  status: string;
  author?: { name: string | null };
  category?: { name: string } | null;
  publishedAt: Date | string | null;
  views: number;
}

interface DataTableProps {
  articles: Article[];
  onRowClick?: (article: Article) => void;
}

export default function DataTable({ articles, onRowClick }: DataTableProps) {
  const columns = [
    {
      key: "title",
      label: "Title",
      render: (row: Article) => (
        <span className="font-medium text-neutral-900 dark:text-white">
          {row.title}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row: Article) => (
        <Badge variant={row.status === "published" ? "success" : "warning"}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (row: Article) => row.category?.name || "—",
    },
    {
      key: "views",
      label: "Views",
    },
    {
      key: "publishedAt",
      label: "Date",
      render: (row: Article) =>
        row.publishedAt
          ? format(new Date(row.publishedAt), "MMM d, yyyy")
          : "—",
    },
  ];

  return (
    <Table
      columns={columns as Column<Record<string, unknown>>[]}
      data={articles as unknown as Record<string, unknown>[]}
      onRowClick={onRowClick as unknown as (row: Record<string, unknown>) => void}
    />
  );
}
