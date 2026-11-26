"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { APPS, label } from "@/lib/apps";
import { useLedger } from "@/lib/ledger";
import { money, signed } from "@/lib/format";
import { totals } from "@/lib/stats";
import TxTable from "@/components/TxTable";
import { AppTag, Button, Kpis, Panel, Segmented, Skeleton, cn, toneOf } from "@/components/ui";

export default function Activity() {
  const { tx, loading } = useLedger();
  const [q, setQ] = useState("");
  const [app, setApp] = useState("");
  const [type, setType] = useState("all");
  const [more, setMore] = useState(100);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return tx.filter((t) => (!app || t.app === app) && (type === "all" || t.type === type) &&
      (!s || label(t).toLowerCase().includes(s) || (t.note || "").toLowerCase().includes(s) || String(t.amount).includes(s)));
  }, [tx, q, app, type]);
  const t = totals(rows);
  if (loading) return <Skeleton className="h-96" />;

  return (
    <>
      <div className="flex items-end justify-between gap-3 mb-4">
        <h1 className="text-[22px] font-semibold tracking-tight">Activity</h1>
        <Segmented value={type} onChange={setType} options={[["all", "All"], ["deposit", "In"], ["withdrawal", "Out"]]} />
      </div>
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <label className="relative flex-1"><Search size={15} className="absolute left-3 top-3 text-mute" />
          <input className="h-10 w-full rounded-[4px] border border-line2 pl-9 pr-3 text-[16px] md:text-[14px] outline-none focus:border-ink" placeholder="Search app, note or amount" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
        </label>
        <div className="flex border border-line2 rounded-[4px] overflow-x-auto">
          <button onClick={() => setApp("")} className={cn("h-10 px-3 text-[12.5px] border-r border-line2", !app ? "bg-ink text-white" : "text-sub")}>All</button>
          {APPS.map((a) => <button key={a.id} onClick={() => setApp(app === a.id ? "" : a.id)} className={cn("h-10 px-3 text-[12.5px] border-r border-line2 last:border-r-0 inline-flex items-center gap-1.5 whitespace-nowrap", app === a.id ? "bg-ink text-white" : "text-sub")}><AppTag app={a.id} size={16} />{a.id === "Promo" ? "Promo" : a.name}</button>)}
        </div>
      </div>
      <Kpis cols="md:grid-cols-4" className="mb-4" items={[
        { label: "Entries", value: rows.length },
        { label: "In", value: money(t.dep) },
        { label: "Out", value: money(t.wd) },
        { label: "Net", value: signed(t.net), tone: toneOf(t.net) },
      ]} />
      <Panel title="Transactions" right={<span className="text-[11px] text-mute">Tap a row to edit</span>} flush><TxTable rows={rows} limit={more} /></Panel>
      {rows.length > more && <Button variant="outline" className="w-full mt-3" onClick={() => setMore(more + 200)}>Show more</Button>}
    </>
  );
}
