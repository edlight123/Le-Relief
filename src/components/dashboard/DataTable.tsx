import Badge from "@/components/ui/Badge";
import { clsx } from "clsx";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";

interface Article {
  id: string;
  title: string;
  status: string;
  author?: { name: string | null };
  category?: { name: string } | null;
  publishedAt: Date | string | null;
  views: number;
}

type AnyRow = object;
type SortDirection = "asc" | "desc";

export interface DataTableColumn<TRow extends AnyRow> {
  key: string;
  label: string;
  render?: (row: TRow) => React.ReactNode;
  sortable?: boolean;
  sortValue?: (row: TRow) => string | number | Date | null | undefined;
}

export interface DataTableRowAction<TRow extends AnyRow> {
  key: string;
  label: string;
  onClick: (row: TRow) => void;
  variant?: "default" | "danger";
  isVisible?: (row: TRow) => boolean;
}

export interface DataTableFilter<TRow extends AnyRow> {
  key: string;
  label: string;
  placeholder?: string;
  predicate: (row: TRow, value: string) => boolean;
}

export interface DataTableSort<TRow extends AnyRow> {
  initialKey?: string;
  initialDirection?: SortDirection;
  compareFns?: Partial<Record<string, (a: TRow, b: TRow) => number>>;
}

export interface DataTableBulkSelection<TRow extends AnyRow> {
  getRowId?: (row: TRow, index: number) => string;
  onChange?: (selectedRows: TRow[]) => void;
  actions?: (selectedRows: TRow[], clearSelection: () => void) => React.ReactNode;
}

interface DataTableBaseProps<TRow extends AnyRow> {
  onRowClick?: (row: TRow) => void;
  rowActions?: DataTableRowAction<TRow>[];
  filters?: DataTableFilter<TRow>[];
  sort?: DataTableSort<TRow>;
  bulkSelection?: boolean | DataTableBulkSelection<TRow>;
  emptyState?: React.ReactNode;
  className?: string;
}

interface DataTableProps<TRow extends AnyRow = Article>
  extends DataTableBaseProps<TRow> {
  articles?: Article[];
  rows?: TRow[];
  columns?: DataTableColumn<TRow>[];
}

function defaultArticleColumns(): DataTableColumn<Article>[] {
  return [
    {
      key: "title",
      label: "Titre",
      render: (row: Article) => (
        <span className="font-headline text-lg font-bold text-foreground">
          {row.title}
        </span>
      ),
    },
    {
      key: "status",
      label: "Statut",
      render: (row: Article) => (
        <Badge variant={row.status === "published" ? "success" : "warning"}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: "category",
      label: "Rubrique",
      render: (row: Article) => row.category?.name || "—",
    },
    {
      key: "views",
      label: "Vues",
    },
    {
      key: "publishedAt",
      label: "Date",
      render: (row: Article) =>
        row.publishedAt
          ? format(new Date(row.publishedAt), "d MMM yyyy", { locale: fr })
          : "—",
    },
  ];
}

  function normalizeSortValue(value: string | number | Date | null | undefined) {
    if (value == null) {
      return "";
    }

    if (value instanceof Date) {
      return value.getTime();
    }

    if (typeof value === "string") {
      const timestamp = Date.parse(value);
      if (!Number.isNaN(timestamp)) {
        return timestamp;
      }
    }

    return value;
  }

  function defaultCompare(a: string | number, b: string | number) {
    if (typeof a === "number" && typeof b === "number") {
      return a - b;
    }

    return String(a).localeCompare(String(b), "fr", { numeric: true });
  }

export default function DataTable<TRow extends AnyRow>(
  props: DataTableProps<TRow>
): React.ReactElement {
    const rows = (props.rows ?? (props.articles as unknown as TRow[]) ?? []) as TRow[];

    const columns = (props.columns ?? (defaultArticleColumns() as unknown as DataTableColumn<TRow>[]));

    const onRowClick = props.onRowClick as ((row: TRow) => void) | undefined;

    const [sortState, setSortState] = useState<{
      key: string;
      direction: SortDirection;
    } | null>(
      props.sort?.initialKey
        ? {
            key: props.sort.initialKey,
            direction: props.sort.initialDirection ?? "asc",
          }
        : null
    );

    const [filterValues, setFilterValues] = useState<Record<string, string>>(() =>
      Object.fromEntries((props.filters ?? []).map((filter) => [filter.key, ""]))
    );

    const bulkSelection =
      typeof props.bulkSelection === "boolean"
        ? props.bulkSelection
          ? {}
          : null
        : props.bulkSelection;

    const getRowId =
      bulkSelection?.getRowId ??
      ((row: TRow, index: number) => {
        const candidate = (row as { id?: string | number }).id;
        return candidate != null ? String(candidate) : String(index);
      });

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const processedRows = useMemo(() => {
      let nextRows = rows;

      if (props.filters?.length) {
        nextRows = nextRows.filter((row) =>
          props.filters!.every((filter) => {
            const value = filterValues[filter.key]?.trim();
            if (!value) {
              return true;
            }
            return filter.predicate(row, value);
          })
        );
      }

      if (sortState) {
        const targetColumn = columns.find((column) => column.key === sortState.key);
        const customCompare = props.sort?.compareFns?.[sortState.key];

        nextRows = [...nextRows].sort((a, b) => {
          const diff = customCompare
            ? customCompare(a, b)
            : defaultCompare(
                normalizeSortValue(
                  targetColumn?.sortValue
                    ? targetColumn.sortValue(a)
                    : (a[sortState.key as keyof TRow] as
                        | string
                        | number
                        | Date
                        | null
                        | undefined)
                ) as string | number,
                normalizeSortValue(
                  targetColumn?.sortValue
                    ? targetColumn.sortValue(b)
                    : (b[sortState.key as keyof TRow] as
                        | string
                        | number
                        | Date
                        | null
                        | undefined)
                ) as string | number
              );

          return sortState.direction === "asc" ? diff : -diff;
        });
      }

      return nextRows;
    }, [columns, filterValues, props.filters, props.sort?.compareFns, rows, sortState]);

    useEffect(() => {
      setSelectedIds((previous) => {
        if (!previous.size) {
          return previous;
        }

        const visibleIds = new Set(
          processedRows.map((row, index) => getRowId(row, index))
        );

        const next = new Set(
          [...previous].filter((id) => visibleIds.has(id))
        );

        return next.size === previous.size ? previous : next;
      });
    }, [getRowId, processedRows]);

    useEffect(() => {
      if (!bulkSelection?.onChange) {
        return;
      }

      const selectedRows = processedRows.filter((row, index) =>
        selectedIds.has(getRowId(row, index))
      );

      bulkSelection.onChange(selectedRows);
    }, [bulkSelection, getRowId, processedRows, selectedIds]);

    const hasActions = Boolean(props.rowActions?.length);

    const allVisibleSelected =
      processedRows.length > 0 &&
      processedRows.every((row, index) => selectedIds.has(getRowId(row, index)));

    return (
      <div className="space-y-3">
        {props.filters?.length ? (
          <div className="flex flex-wrap items-center gap-2">
            {props.filters.map((filter) => (
              <label key={filter.key} className="inline-flex items-center gap-2">
                <span className="text-xs font-medium text-muted">{filter.label}</span>
                <input
                  type="text"
                  value={filterValues[filter.key] ?? ""}
                  placeholder={filter.placeholder}
                  onChange={(event) =>
                    setFilterValues((previous) => ({
                      ...previous,
                      [filter.key]: event.target.value,
                    }))
                  }
                  className="h-9 rounded-md border border-border-subtle bg-background px-3 text-sm"
                />
              </label>
            ))}
          </div>
        ) : null}

        {bulkSelection && selectedIds.size > 0 ? (
          <div className="flex items-center justify-between rounded-md border border-border-subtle bg-surface-newsprint px-3 py-2">
            <span className="text-sm text-muted">
              {selectedIds.size} élément(s) sélectionné(s)
            </span>
            <div>
              {bulkSelection.actions?.(
                processedRows.filter((row, index) => selectedIds.has(getRowId(row, index))),
                () => setSelectedIds(new Set())
              )}
            </div>
          </div>
        ) : null}

        <div
          className={clsx(
            "overflow-x-auto border border-border-subtle",
            props.className
          )}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-strong bg-surface-newsprint">
                {bulkSelection ? (
                  <th className="w-12 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      aria-label="Sélectionner tout"
                      checked={allVisibleSelected}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelectedIds(
                            new Set(
                              processedRows.map((row, index) => getRowId(row, index))
                            )
                          );
                          return;
                        }
                        setSelectedIds(new Set());
                      }}
                    />
                  </th>
                ) : null}

                {columns.map((column) => {
                  const isSorted = sortState?.key === column.key;
                  const canSort = column.sortable || props.sort?.compareFns?.[column.key];

                  return (
                    <th
                      key={column.key}
                      className="px-4 py-3 text-left font-label text-xs font-extrabold uppercase text-muted"
                    >
                      {canSort ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1"
                          onClick={() =>
                            setSortState((previous) => {
                              if (!previous || previous.key !== column.key) {
                                return { key: column.key, direction: "asc" };
                              }

                              if (previous.direction === "asc") {
                                return { key: column.key, direction: "desc" };
                              }

                              return null;
                            })
                          }
                        >
                          <span>{column.label}</span>
                          {isSorted ? (
                            sortState?.direction === "asc" ? (
                              <ChevronUp className="h-3.5 w-3.5 text-primary" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-primary" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-muted" />
                          )}
                        </button>
                      ) : (
                        column.label
                      )}
                    </th>
                  );
                })}

                {hasActions ? (
                  <th className="px-4 py-3 text-right font-label text-xs font-extrabold uppercase text-muted">
                    Actions
                  </th>
                ) : null}
              </tr>
            </thead>

            <tbody>
              {processedRows.map((row, index) => {
                const rowId = getRowId(row, index);
                const isSelected = selectedIds.has(rowId);

                return (
                  <tr
                    key={rowId}
                    onClick={() => onRowClick?.(row)}
                    className={clsx(
                      "border-b border-border-subtle last:border-0",
                      onRowClick && "cursor-pointer hover:bg-surface-newsprint"
                    )}
                  >
                    {bulkSelection ? (
                      <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label="Sélectionner la ligne"
                          checked={isSelected}
                          onChange={(event) => {
                            setSelectedIds((previous) => {
                              const next = new Set(previous);
                              if (event.target.checked) {
                                next.add(rowId);
                              } else {
                                next.delete(rowId);
                              }
                              return next;
                            });
                          }}
                        />
                      </td>
                    ) : null}

                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className="px-4 py-3 font-label text-sm text-foreground/80"
                      >
                        {column.render
                          ? column.render(row)
                          : (row[column.key as keyof TRow] as React.ReactNode)}
                      </td>
                    ))}

                    {hasActions ? (
                      <td
                        className="px-4 py-3 text-right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-2">
                          {props.rowActions?.map((action) => {
                            if (action.isVisible && !action.isVisible(row)) {
                              return null;
                            }

                            return (
                              <button
                                key={action.key}
                                type="button"
                                className={clsx(
                                  "rounded-md border px-2 py-1 text-xs",
                                  action.variant === "danger"
                                    ? "border-red-300 text-red-700"
                                    : "border-border-subtle text-foreground"
                                )}
                                onClick={() => action.onClick(row)}
                              >
                                {action.label}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                );
              })}

              {processedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (bulkSelection ? 1 : 0) + (hasActions ? 1 : 0)}
                    className="px-4 py-8 text-center font-body text-muted"
                  >
                    {props.emptyState ?? "Aucune donnée trouvée"}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    );
}
