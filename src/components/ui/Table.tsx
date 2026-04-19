import { clsx } from "clsx";

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  className?: string;
  onRowClick?: (row: T) => void;
}

export default function Table<T extends Record<string, unknown>>({
  columns,
  data,
  className,
  onRowClick,
}: TableProps<T>) {
  return (
    <div
      className={clsx(
        "overflow-x-auto border border-border-subtle",
        className
      )}
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-strong bg-surface-newsprint">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left font-label text-xs font-extrabold uppercase text-muted"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              onClick={() => onRowClick?.(row)}
              className={clsx(
                "border-b border-border-subtle last:border-0",
                onRowClick && "cursor-pointer hover:bg-surface-newsprint"
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="px-4 py-3 font-label text-sm text-foreground/80"
                >
                  {col.render
                    ? col.render(row)
                    : (row[col.key] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center font-body text-muted"
              >
                Aucune donnée trouvée
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
