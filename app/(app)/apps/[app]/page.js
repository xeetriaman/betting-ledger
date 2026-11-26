"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus } from "lucide-react";
import { appBySlug } from "@/lib/apps";
import { useLedger } from "@/lib/ledger";
import { dayKey, fmtDay, fmtMonth, money, signed } from "@/lib/format";
import { cumulative, dated, heatmap, inRange, monthly, patterns, promoSites, sizes, totals } from "@/lib/stats";
import { Bars, Heatmap, MonthBars, NetArea } from "@/components/Charts";
import DataTable from "@/components/DataTable";
import TxTable from "@/components/TxTable";
import { AppTag, Button, Kpis, Panel, Segmented, Skeleton, cn, toneOf } from "@/components/ui";

const RANGES = [["all", "All"], ["90d", "90D"], ["30d", "30D"]];
const moneyCol = (id, header, key) => ({ id, header, accessorKey: key, meta: { align: "right" }, cell: ({ getValue }) => <span className="num">{money(getValue())}</span> });
const netCol = { id: "net", header: "Net", accessorKey: "net", meta: { align: "right" }, cell: ({ getValue }) => <span className={cn("num font-medium", toneOf(getValue()))}>{signed(getValue())}</span> };
const monthCols = [{ id: "m", header: "Month", accessorKey: "k", cell: ({ getValue }) => fmtMonth(getValue(), true) }, moneyCol("in", "In", "dep"), moneyCol("out", "Out", "wd"), netCol];
const siteCols = [{ id: "name", header: "Promo app", accessorKey: "name", cell: ({ row: { original: s } }) => <span className="inline-flex items-center gap-2"><AppTag app="Promo" name={s.name} size={18} />{s.name}</span> }, moneyCol("in", "In", "dep"), moneyCol("out", "Out", "wd"), netCol];

export default function AppPage() {
  const { app: slug } = useParams();
  const app = appBySlug(slug);
  const { tx, loading, setSheet } = useLedger();
  const [range, setRange] = useState("all");
  const [site, setSite] = useState("");

  const mine = useMemo(() => tx.filter((t) => app && t.app === app.id && (!site || t.promo === site)), [tx, app, site]);
  const scoped = useMemo(() => inRange(mine, range), [mine, range]);
  const sites = useMemo(() => (app?.id === "Promo" ? promoSites(tx) : []), [tx, app]);
  if (!app) return <p>App not found. <Link className="underline" href="/">Back to overview</Link></p>;
  if (loading) return <div className="grid gap-4"><Skeleton className="h-24" /><Skeleton className="h-72" /></div>;

  const t = totals(scoped);
  const deps = scoped.filter((x) => x.type === "deposit");
  const biggest = deps.reduce((m, x) => Math.max(m, Number(x.amount)), 0);
  const lastDep = mine.find((x) => x.type === "deposit");
  const months = monthly(dated(scoped));
  const pats = patterns(scoped);

  return (
    <>
      <div className="text-[12px] text-mute mb-3"><Link href="/" className="hover:text-ink">Overview</Link> / {app.name}{site && ` / ${site}`}</div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <AppTag app={app.id} size={36} />
        <div className="flex-1 min-w-0"><h1 className="text-[22px] font-semibold tracking-tight leading-tight">{site || app.name}</h1><div className="text-[12.5px] text-mute">{t.nDep} deposits · {t.nWd} withdrawals</div></div>
        <Segmented value={range} onChange={setRange} options={RANGES} />
        <Button size="sm" onClick={() => setSheet({ mode: "add", preset: { app: app.id, promo: site } })}><Plus size={15} />Add</Button>
      </div>

      <Kpis cols="md:grid-cols-6" items={[
        { label: "Net P/L", value: signed(t.net), tone: toneOf(t.net) },
        { label: "Deposited", value: money(t.dep) },
        { label: "Withdrawn", value: money(t.wd) },
        { label: "Back per $1", value: t.dep ? "$" + (t.wd / t.dep).toFixed(2) : "—", tone: t.dep ? (t.wd / t.dep < 1 ? "text-down" : "text-up") : "" },
        { label: "Avg deposit", value: t.nDep ? money(t.dep / t.nDep) : "—", sub: biggest ? `Max ${money(biggest)}` : "" },
        { label: "Last deposit", value: lastDep ? fmtDay(dayKey(lastDep.occurred_at)) : "—" },
      ]} />

      <Panel className="mt-4" title="Running P/L"><NetArea data={cumulative(scoped)} /></Panel>

      {sites.length > 0 && (
        <Panel className="mt-4" title={`Promo apps · ${sites.length}`} right={site && <button className="text-[12px] text-sub" onClick={() => setSite("")}>Clear filter</button>} flush>
          <DataTable columns={siteCols} data={sites} initialSort={[{ id: "net", desc: true }]} onRowClick={(s) => setSite(site === s.name ? "" : s.name)} />
        </Panel>
      )}

      <div className="grid gap-4 mt-4 lg:grid-cols-2">
        <Panel title="Month by month" flush>
          <div className="p-3"><MonthBars data={months} /></div>
          <div className="border-t border-line"><DataTable columns={monthCols} data={[...months].reverse()} /></div>
        </Panel>
        <div className="grid gap-4 content-start">
          <Panel title="When you deposit" right={<span className="num text-[11px] text-mute">{deps.filter((d) => !d.approx).length} timed</span>}><Heatmap grid={heatmap(scoped)} /></Panel>
          <Panel title="Deposit size"><Bars color="#3f3f46" rows={sizes(scoped).map((s) => ({ k: s.name, v: s.sum, lab: `${s.n} · ${money(s.sum, 0)}` }))} /></Panel>
        </div>
      </div>

      {pats.length > 0 && (
        <Panel className="mt-4" title="Patterns" flush>
          <div className="grid md:grid-cols-5 gap-px bg-line">
            {pats.map((p) => <div key={p.k} className="bg-white p-3"><div className="font-medium text-[13.5px] leading-snug">{p.title}</div><div className="text-[12.5px] text-mute mt-1">{p.body}</div></div>)}
          </div>
        </Panel>
      )}

      <Panel className="mt-4" title={`Transactions · ${scoped.length}`} flush><TxTable rows={scoped} limit={200} /></Panel>
    </>
  );
}
