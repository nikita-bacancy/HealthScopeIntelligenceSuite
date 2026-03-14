"use client";

import { useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef
} from "@tanstack/react-table";

function capitalizeValue(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export type DataTableColumn<TData extends Record<string, unknown>> = {
  key: keyof TData & string;
  header: string;
  variant?: "default" | "mono";
  /** When true, display string values with first letter uppercase (e.g. status, type). */
  capitalize?: boolean;
};

type DataTableProps<TData extends Record<string, unknown>> = {
  columns: Array<DataTableColumn<TData>>;
  data: TData[];
  emptyMessage: string;
};

export function DataTable<TData extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage
}: DataTableProps<TData>) {
  const columnDefs = useMemo<ColumnDef<TData>[]>(
    () =>
      columns.map((column) => ({
        accessorKey: column.key,
        header: column.header,
        cell: ({ getValue }) => {
          const value = getValue();
          const raw = value == null || value === "" ? "—" : String(value);
          const text =
            column.capitalize && raw !== "—" && typeof value === "string"
              ? capitalizeValue(raw)
              : raw;

          return (
            <span
              className={
                column.variant === "mono"
                  ? "font-mono text-xs text-slate-700 break-all"
                  : "text-sm text-slate-700"
              }
            >
              {text}
            </span>
          );
        }
      })),
    [columns]
  );

  const table = useReactTable({
    data,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-slate-50/90">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    className="border-b border-slate-200 px-4 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-slate-500"
                    key={header.id}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white/70">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr className="transition-colors hover:bg-emerald-50/40" key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td className="border-b border-slate-100 px-4 py-3 align-top" key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-8 text-sm text-slate-500"
                  colSpan={table.getAllColumns().length}
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
