import type { ReactNode } from "react";

export type DataTableColumn<TRow> = {
  key: string;
  header: string;
  render: (row: TRow) => ReactNode;
};

type DataTableProps<TRow> = {
  caption: string;
  columns: DataTableColumn<TRow>[];
  rows: TRow[];
  getRowKey: (row: TRow) => string;
};

export function DataTable<TRow>({ caption, columns, rows, getRowKey }: DataTableProps<TRow>) {
  return (
    <div className="overflow-hidden rounded-card shadow-[var(--shadow-inset-subtle)]">
      <table className="w-full border-collapse text-right text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-surface-recessed text-xs font-semibold text-text-muted">
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className="px-4 py-3">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle bg-surface">
          {rows.map((row) => (
            <tr key={getRowKey(row)} className="transition-colors hover:bg-surface-recessed/70">
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-4 align-middle">
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
