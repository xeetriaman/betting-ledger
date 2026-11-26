"use client";
import { useMemo } from "react";
import { useLedger } from "@/lib/ledger";
import { fmtMonth, money, signed } from "@/lib/format";
import { byApp, dated, heatmap, monthly, patterns, weekly } from "@/lib/stats";
import { Bars, Heatmap, MonthBars, WeekBars } from "@/components/Charts";
import DataTable from "@/components/DataTable";
import { Kpis, Panel, Skeleton, cn, toneOf } from "@/components/ui";

const monthCols = [
  { id: "m", header: "Month", accessorKey: "k", cell: ({ getValue }) => fmtMonth(getValue(), true) },
  { id: "in", header: "In", accessorKey: "dep", meta: { align: "right" }, cell: ({ getValue }) => <span className="num">{money(getValue())}</span> },
  { id: "out", header: "Out", accessorKey: "wd", meta: { align: "right" }, cell: ({ getValue }) => <span className="num">{money(getValue())}</span> },
  { id: "net", header: "Net", accessorKey: "net", meta: { align: "right" }, cell: ({ getValue }) => <span className={cn("num font-medium", toneOf(getValue()))}>{signed(getValue())}</span> },
];

export default function Insights() {
  const { tx, limit, loading } = useLedger();
  const weeks = useMemo(() => weekly(tx, 12), [tx]);
  const months = useMemo(() => monthly(dated(tx)), [tx]);
  const apps = useMemo(() => byApp(tx), [tx]);
  const pats = useMemo(() => patterns(tx), [tx]);
  if (loading) return <Skeleton className="h-96" />;
  const over = weeks.filter((w) => w.dep > limit).length;
  const avg = weeks.reduce((s, w) => s + w.dep, 0) / weeks.length;
  const late = pats.find((p) => p.k === "late");

  return (
    <>
      <h1 className="text-[22px] font-semibold tracking-tight mb-4">Insights</h1>
      <Kpis cols="md:grid-cols-4" items={[
        { label: "Weeks over limit", value: `${over} / 12`, tone: over ? "text-down" : "text-up" },
        { label: "Avg weekly deposit", value: money(avg), sub: `Limit ${money(limit, 0)}` },
        { label: "Biggest week", value: money(Math.max(...weeks.map((w) => w.dep))) },
        { label: "Late-night share", value: late ? late.title.split("%")[0] + "%" : "—", sub: "10pm – 5am" },
      ]} />
      <Panel className="mt-4" title="Weekly deposits · last 12 weeks" right={<span className="text-[11px] text-mute">Dashed = {money(limit, 0)} limit</span>}><WeekBars data={weeks} limit={limit} /></Panel>
      <div className="grid gap-4 mt-4 lg:grid-cols-2">
        <Panel title="Net P/L by app"><Bars rows={apps.map((a) => ({ k: a.app.name, v: a.net }))} /></Panel>
        <Panel title="Deposits by app"><Bars color="#3f3f46" rows={apps.map((a) => ({ k: a.app.name, v: a.dep, lab: money(a.dep, 0) }))} /></Panel>
        <Panel title="When you deposit · all apps"><Heatmap grid={heatmap(tx)} /></Panel>
        <Panel title="Patterns" flush>
          <div className="divide-y divide-line">{pats.map((p) => <div key={p.k} className="p-3"><div className="font-medium text-[13.5px]">{p.title}</div><div className="text-[12.5px] text-mute mt-0.5">{p.body}</div></div>)}</div>
        </Panel>
      </div>
      <Panel className="mt-4" title="Month by month" flush>
        <div className="p-3"><MonthBars data={months} /></div>
        <div className="border-t border-line"><DataTable columns={monthCols} data={[...months].reverse()} /></div>
      </Panel>
    </>
  );
}
