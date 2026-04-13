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
        "overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-xl",
        className
      )}
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left font-medium text-neutral-500 dark:text-neutral-400"
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
                "border-b border-neutral-100 dark:border-neutral-800 last:border-0",
                onRowClick && "cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="px-4 py-3 text-neutral-700 dark:text-neutral-300"
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
                className="px-4 py-8 text-center text-neutral-400"
              >
                No data found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
