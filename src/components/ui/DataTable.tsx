import React from "react";
import type { LucideIcon } from "lucide-react";
import { EmptyState } from "./EmptyState";
import { Skeleton, SkeletonRows } from "./Skeleton";

/**
 * Table.
 *
 * There were eleven hand-rolled <table> blocks in this app — nine admin
 * tabs plus Markets, Wallet, Trading and Overview — each with its own
 * header styling, empty state, and horizontal-scroll workaround. This is
 * the one implementation.
 *
 * The part that isn't boilerplate: **below `sm` the table stops being a
 * table.** Each row renders as a stacked card with its columns as
 * label/value pairs. A financial table forced through a horizontal
 * scroller on a 375px screen hides the numbers behind a gesture nobody
 * discovers, and freezing the first column only trades one problem for a
 * narrower one. Columns opt out of the card with `hideOnMobile` and one
 * column is promoted to the card's title via `primary`.
 *
 * Numeric columns are right-aligned and tabular by default, so digits line
 * up down the column and don't jitter when a value ticks.
 */

export interface SortState {
  key: string;
  ascending: boolean;
}

export interface Column<Row> {
  /** Stable key. Also used as the mobile card's label. */
  key: string;
  header: React.ReactNode;
  /**
   * Marks the column sortable. The header becomes a real <button> with
   * aria-sort on the cell — sortable <th>s with bare onClick are invisible
   * to assistive tech and unreachable by keyboard.
   */
  sortable?: boolean;
  /** Cell renderer. Gets the row and its index. */
  cell: (row: Row, index: number) => React.ReactNode;
  /** Right-aligns and applies tabular figures. Use for every money column. */
  numeric?: boolean;
  /** Promotes this column to the mobile card's heading. Use on exactly one. */
  primary?: boolean;
  /** Drops the column from the mobile card entirely. */
  hideOnMobile?: boolean;
  /** Tailwind width utility, e.g. "w-32". */
  width?: string;
  align?: "left" | "center" | "right";
}

export interface DataTableProps<Row> {
  columns: Column<Row>[];
  rows: Row[];
  /** Stable identity per row. Index is a last resort — it breaks animation. */
  rowKey: (row: Row, index: number) => string;
  loading?: boolean;
  onRowClick?: (row: Row) => void;
  /** Shown when `rows` is empty and not loading. */
  empty?: {
    icon?: LucideIcon;
    title: string;
    description?: React.ReactNode;
    action?: React.ReactNode;
  };
  /** Accessible name for the table. */
  caption?: string;
  /** Current sort. Sorting itself stays with the caller. */
  sort?: SortState;
  onSortChange?: (next: SortState) => void;
  className?: string;
}

const alignClass = (col: Column<unknown>) => {
  const align = col.align ?? (col.numeric ? "right" : "left");
  return align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
};

export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  loading = false,
  onRowClick,
  empty,
  caption,
  sort,
  onSortChange,
  className = "",
}: DataTableProps<Row>) {
  const showEmpty = !loading && rows.length === 0;

  if (showEmpty && empty) {
    return (
      <div className={`rounded-xl border border-line bg-surface ${className}`}>
        <EmptyState {...empty} />
      </div>
    );
  }

  const primaryCol = columns.find((c) => c.primary) ?? columns[0];
  const mobileCols = columns.filter((c) => !c.hideOnMobile && c !== primaryCol);

  return (
    <div className={className}>
      {/* ── Desktop: a real table ─────────────────────────────── */}
      <div className="hidden overflow-x-auto rounded-xl border border-line bg-surface sm:block">
        <table className="w-full border-collapse text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-line">
              {columns.map((col) => {
                const active = sort?.key === col.key;
                const canSort = col.sortable && onSortChange;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={
                      active ? (sort!.ascending ? "ascending" : "descending") : canSort ? "none" : undefined
                    }
                    className={
                      `px-4 py-3 text-2xs font-semibold uppercase tracking-[0.09em] text-faint ` +
                      `${alignClass(col as Column<unknown>)} ${col.width ?? ""}`
                    }
                  >
                    {canSort ? (
                      <button
                        type="button"
                        onClick={() =>
                          onSortChange({ key: col.key, ascending: active ? !sort!.ascending : false })
                        }
                        className={
                          "inline-flex items-center gap-1 rounded-sm uppercase tracking-[0.09em] " +
                          "transition-colors duration-[--duration-fast] cursor-pointer " +
                          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
                          (active ? "text-ink" : "hover:text-ink")
                        }
                      >
                        {col.header}
                        <span aria-hidden="true" className={active ? "opacity-100" : "opacity-0"}>
                          {active && sort!.ascending ? "▲" : "▼"}
                        </span>
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows rows={5} cols={columns.length} />
            ) : (
              rows.map((row, index) => (
                <tr
                  key={rowKey(row, index)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  // Keyboard parity: a clickable row has to be reachable
                  // and activatable without a mouse.
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? "button" : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                  className={
                    "border-b border-line/60 last:border-0 transition-colors duration-[--duration-fast] " +
                    (onRowClick
                      ? "cursor-pointer hover:bg-raised focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent "
                      : "")
                  }
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={
                        `px-4 py-3.5 text-ink ${alignClass(col as Column<unknown>)} ` +
                        (col.numeric ? "font-data tabular-nums" : "")
                      }
                    >
                      {col.cell(row, index)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mobile: stacked cards ─────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:hidden">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-line bg-surface p-4">
                <Skeleton width="w-32" height="h-4" />
                <Skeleton width="w-full" height="h-3" className="mt-3" />
                <Skeleton width="w-24" height="h-3" className="mt-2" />
              </div>
            ))
          : rows.map((row, index) => (
              <div
                key={rowKey(row, index)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? "button" : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
                className={
                  "rounded-xl border border-line bg-surface p-4 transition-colors duration-[--duration-fast] " +
                  (onRowClick
                    ? "cursor-pointer active:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    : "")
                }
              >
                <div className="mb-2.5 text-sm font-semibold text-ink">
                  {primaryCol.cell(row, index)}
                </div>
                <dl className="flex flex-col gap-1.5">
                  {mobileCols.map((col) => (
                    <div key={col.key} className="flex items-baseline justify-between gap-3">
                      <dt className="text-2xs font-semibold uppercase tracking-[0.09em] text-faint">
                        {col.header}
                      </dt>
                      <dd
                        className={
                          `text-sm text-ink text-right ` +
                          (col.numeric ? "font-data tabular-nums" : "")
                        }
                      >
                        {col.cell(row, index)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
      </div>
    </div>
  );
}
