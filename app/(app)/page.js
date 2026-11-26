"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ScanFace, X } from "lucide-react";
import { useLedger } from "@/lib/ledger";
import { fmtDay, money, signed, todayKey } from "@/lib/format";
import { byApp, cumulative, dated, inRange, monthly, thisWeek, totals } from "@/lib/stats";
import { friendlyWebAuthnError, hasPasskeyHere, passkeySupported, registerPasskey } from "@/lib/passkey";
import { NetArea } from "@/components/Charts";
import DataTable from "@/components/DataTable";
import TxTable from "@/components/TxTable";
import { AppTag, Button, Kpis, Panel, Segmented, Skeleton, cn, toneOf } from "@/components/ui";

const RANGES = [["all", "All"], ["month", "MTD"], ["30d", "30D"], ["week", "WTD"]];

function FaceStrip() {
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState("");
  useEffect(() => { try { setShow(passkeySupported() && !hasPasskeyHere() && localStorage.getItem("ledger.faceid.skip") !== "1"); } catch {} }, []);
  if (!show) return null;
  return (
    <div className="flex items-center gap-3 border border-line rounded-[4px] px-3 py-2.5 mb-4 bg-soft">
      <ScanFace size={18} />
      <span className="flex-1 text-[13px]">{msg || "Turn on Face ID to sign in without a password."}</span>
      <Button size="sm" onClick={async () => { try { await registerPasskey(); setShow(false); } catch (e) { setMsg(friendlyWebAuthnError(e)); } }}>Turn on</Button>
      <button aria-label="Dismiss" className="text-mute" onClick={() => { try { localStorage.setItem("ledger.faceid.skip", "1"); } catch {} setShow(false); }}><X size={16} /></button>
    </div>
  );
}

export default function Overview() {
  const router = useRouter();
  const { tx, limit, loading, error } = useLedger();
  const [range, setRange] = useState("all");
  const scoped = useMemo(() => inRange(tx, range), [tx, range]);
  const t = useMemo(() => totals(scoped), [scoped]);
  const curve = useMemo(() => cumulative(scoped), [scoped]);
  const apps = useMemo(() => byApp(tx), [tx]);
  const week = useMemo(() => thisWeek(tx), [tx]);
  const months = useMemo(() => monthly(dated(tx)), [tx]);
  const mtd = months[months.length - 1];
  const allDep = apps.reduce((s, a) => s + a.dep, 0) || 1;
  const today = todayKey();

  const appCols = useMemo(() => [
    { id: "app", header: "App", accessorFn: (r) => r.app.name, cell: ({ row: { original: r } }) => <span className="inline-flex items-center gap-2 font-medium"><AppTag app={r.app.id} />{r.app.name}</span> },
    { id: "n", header: "Deps", accessorKey: "nDep", meta: { align: "right", className: "hidden md:table-cell" }, cell: ({ getValue }) => <span className="num text-sub">{getValue()}</span> },
    { id: "in", header: "In", accessorKey: "dep", meta: { align: "right" }, cell: ({ getValue }) => <span className="num">{money(getValue(), 0)}</span> },
    { id: "out", header: "Out", accessorKey: "wd", meta: { align: "right", className: "hidden sm:table-cell" }, cell: ({ getValue }) => <span className="num">{money(getValue(), 0)}</span> },
    { id: "net", header: "Net", accessorKey: "net", meta: { align: "right" }, cell: ({ getValue }) => <span className={cn("num font-medium", toneOf(getValue()))}>{signed(getValue())}</span> },
    { id: "share", header: "% In", accessorFn: (r) => r.dep, meta: { align: "right", className: "hidden md:table-cell w-[140px]" },
      cell: ({ getValue }) => { const p = (getValue() / allDep) * 100; return <span className="inline-flex items-center gap-2 justify-end w-full"><span className="h-1.5 w-16 bg-soft border border-line rounded-[2px] overflow-hidden"><i className="block h-full bg-ink" style={{ width: `${p}%` }} /></span><span className="num text-sub w-9">{p.toFixed(0)}%</span></span>; } },
  ], [allDep]);

  if (loading) return <div className="grid gap-4"><Skeleton className="h-24" /><Skeleton className="h-72" /><Skeleton className="h-60" /></div>;
  const dayMax = Math.max(limit / 2, ...week.days.map((d) => d.dep), 1);

  return (
    <>
      <div className="flex items-end justify-between gap-3 mb-4">
        <div><div className="label mb-1.5">{fmtDay(today, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div><h1 className="text-[22px] font-semibold tracking-tight">Overview</h1></div>
        <Segmented value={range} onChange={setRange} options={RANGES} />
      </div>
      {error && <div className="border border-down/30 bg-downbg text-down rounded-[4px] p-2.5 mb-4 text-[13px]">{error}</div>}
      <FaceStrip />

      <Kpis items={[
        { label: "Net P/L", value: signed(t.net), tone: toneOf(t.net), sub: `${t.nDep + t.nWd} entries` },
        { label: "Deposited", value: money(t.dep), sub: `${t.nDep} deposits` },
        { label: "Withdrawn", value: money(t.wd), sub: `${t.nWd} withdrawals` },
        { label: "Week / limit", value: `${money(week.total, 0)} / ${money(limit, 0)}`, tone: week.total > limit ? "text-down" : "", sub: week.total > limit ? `${money(week.total - limit)} over` : `${money(limit - week.total)} left` },
        { label: "Month to date", value: mtd ? signed(mtd.net) : "—", tone: mtd ? toneOf(mtd.net) : "", sub: mtd ? `${money(mtd.dep, 0)} in · ${money(mtd.wd, 0)} out` : "" },
      ]} />

      <Panel className="mt-4" title="Running P/L" right={<span className="num text-[12px] text-mute">{curve[0] ? `${curve[0].label} – ${curve[curve.length - 1].label}` : ""}</span>}>
        <NetArea data={curve} />
      </Panel>

      <div className="grid gap-4 mt-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel title="Apps" right={<Link href="/insights" className="text-[12px] text-sub hover:text-ink">Compare →</Link>} flush>
          <DataTable columns={appCols} data={apps} initialSort={[{ id: "in", desc: true }]} onRowClick={(r) => router.push(`/apps/${r.app.slug}`)} />
        </Panel>
        <Panel title="This week" right={<span className={cn("num text-[12px]", week.total > limit ? "text-down" : "text-mute")}>{money(week.total)}</span>}>
          <div className="grid grid-cols-7 gap-1.5 items-end h-28">
            {week.days.map((d, i) => (
              <div key={d.k} className="flex flex-col items-center justify-end h-full gap-1" title={`${fmtDay(d.k)} ${money(d.dep)}`}>
                <span className="num text-[10px] text-mute">{d.dep ? Math.round(d.dep) : ""}</span>
                <span className={cn("w-full max-w-7 rounded-[2px]", d.dep > limit ? "bg-down" : d.dep ? "bg-zinc-400" : "bg-soft border border-line")} style={{ height: Math.max(3, Math.round((d.dep / dayMax) * 72)) }} />
                <span className={cn("text-[10.5px]", d.k === today ? "text-ink font-semibold" : "text-mute")}>{"MTWTFSS"[i]}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 h-1.5 bg-soft border border-line rounded-[2px] overflow-hidden"><i className={cn("block h-full", week.total > limit ? "bg-down" : "bg-up")} style={{ width: `${Math.min(100, (week.total / (limit || 1)) * 100)}%` }} /></div>
          <div className="flex justify-between text-[12px] text-mute mt-1.5"><span>Mon–Sun</span><span className="num">Limit {money(limit, 0)}</span></div>
        </Panel>
      </div>

      <Panel className="mt-4" title="Recent activity" right={<Link href="/activity" className="text-[12px] text-sub hover:text-ink">All →</Link>} flush>
        <TxTable rows={dated(tx)} limit={10} />
      </Panel>
    </>
  );
}
