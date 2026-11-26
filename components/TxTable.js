"use client";
import { useMemo } from "react";
import { label } from "@/lib/apps";
import { useLedger } from "@/lib/ledger";
import { dayKey, fmtDay, fmtTime, money } from "@/lib/format";
import DataTable from "./DataTable";
import { AppTag, cn } from "./ui";

export default function TxTable({ rows, limit, compact }) {
  const { setSheet } = useLedger();
  const columns = useMemo(() => [
    { id: "date", header: "Date", accessorFn: (t) => t.occurred_at, sortingFn: "datetime",
      cell: ({ row: { original: t } }) => <span className="num text-sub">{fmtDay(dayKey(t.occurred_at), { day: "2-digit", month: "short" })}{!compact && <span className="text-mute hidden md:inline"> {t.approx ? "—" : fmtTime(t.occurred_at)}</span>}</span> },
    { id: "app", header: "App", accessorFn: label,
      cell: ({ row: { original: t } }) => <span className="inline-flex items-center gap-2"><AppTag app={t.app} name={t.promo} size={18} /><span className="truncate max-w-[96px] sm:max-w-[160px] md:max-w-none">{label(t)}</span>{t.approx && <span className="hidden sm:inline label !text-[9px] border border-line rounded-[2px] px-1 py-0.5">sum</span>}</span> },
    ...(compact ? [] : [{ id: "type", header: "Type", accessorKey: "type", cell: ({ getValue }) => <span className={cn("text-[12px]", getValue() === "deposit" ? "text-down" : "text-up")}>{getValue() === "deposit" ? "Deposit" : "Withdrawal"}</span>, meta: { className: "hidden md:table-cell" } }]),
    { id: "amount", header: "Amount", accessorFn: (t) => (t.type === "deposit" ? -1 : 1) * Number(t.amount), meta: { align: "right" },
      cell: ({ getValue }) => { const v = getValue(); return <span className={cn("num font-medium", v < 0 ? "text-down" : "text-up")}>{v < 0 ? "−" : "+"}{money(v)}</span>; } },
    ...(compact ? [] : [{ id: "note", header: "Note", accessorKey: "note", enableSorting: false, cell: ({ getValue }) => <span className="text-mute truncate block max-w-[220px]">{getValue() || ""}</span>, meta: { className: "hidden lg:table-cell" } }]),
  ], [compact]);
  return <DataTable columns={columns} data={rows} limit={limit} onRowClick={(t) => setSheet({ mode: "edit", row: t })} />;
}
