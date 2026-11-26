"use client";
import { useState } from "react";
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "./ui";

// Sortable, dense table. Column meta: { align: "right", className }.
export default function DataTable({ columns, data, onRowClick, initialSort = [], limit, empty = "Nothing here yet.", footer }) {
  const [sorting, setSorting] = useState(initialSort);
  const table = useReactTable({ data, columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() });
  const rows = table.getRowModel().rows;
  const shown = limit ? rows.slice(0, limit) : rows;
  if (!data.length) return <p className="text-mute p-4">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13.5px]">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b border-line">
              {hg.headers.map((h) => {
                const m = h.column.columnDef.meta || {};
                const s = h.column.getIsSorted();
                return (
                  <th key={h.id} className={cn("label h-9 px-3 font-medium whitespace-nowrap select-none", m.align === "right" ? "text-right" : "text-left", m.className)}>
                    {h.column.getCanSort() ? (
                      <button className={cn("inline-flex items-center gap-1 uppercase", s && "text-ink")} onClick={h.column.getToggleSortingHandler()}>
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {s === "asc" ? <ChevronUp size={12} /> : s === "desc" ? <ChevronDown size={12} /> : null}
                      </button>
                    ) : flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {shown.map((r) => (
            <tr key={r.id} onClick={onRowClick ? () => onRowClick(r.original) : undefined}
              className={cn("border-b border-line last:border-b-0", onRowClick && "cursor-pointer hover:bg-soft")}>
              {r.getVisibleCells().map((c) => {
                const m = c.column.columnDef.meta || {};
                return <td key={c.id} className={cn("h-10 px-3 whitespace-nowrap", m.align === "right" && "text-right", m.className)}>{flexRender(c.column.columnDef.cell, c.getContext())}</td>;
              })}
            </tr>
          ))}
        </tbody>
        {footer}
      </table>
    </div>
  );
}
