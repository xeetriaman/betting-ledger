"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { APPS, label } from "@/lib/apps";
import { useLedger } from "@/lib/ledger";
import { money, signed, tone } from "@/lib/format";
import { totals } from "@/lib/stats";
import TxList from "@/components/TxList";
import { Seg, Skeleton } from "@/components/ui";

export default function Activity() {
  const { tx, loading } = useLedger();
  const [q, setQ] = useState("");
  const [app, setApp] = useState("");
  const [type, setType] = useState("all");
  const [more, setMore] = useState(60);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return tx.filter((t) => (!app || t.app === app) && (type === "all" || t.type === type) &&
      (!s || label(t).toLowerCase().includes(s) || (t.note || "").toLowerCase().includes(s) || String(t.amount).includes(s)));
  }, [tx, q, app, type]);
  const t = totals(rows);

  if (loading) return <Skeleton h={400} />;
  return (
    <>
      <header className="top"><h1>Activity</h1><Seg value={type} onChange={setType} options={[["all", "All"], ["deposit", "In"], ["withdrawal", "Out"]]} /></header>
      <div className="searchwrap"><Search size={18} /><input className="search" placeholder="Search app, note or amount" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" /></div>
      <div className="chips" style={{ margin: "12px 0 4px" }}>
        <button className={`chip ${!app ? "on" : ""}`} onClick={() => setApp("")}>All apps</button>
        {APPS.map((a) => <button key={a.id} className={`chip ${app === a.id ? "on" : ""}`} onClick={() => setApp(app === a.id ? "" : a.id)}><i style={{ background: a.bg }} />{a.name}</button>)}
      </div>
      <div className="stats" style={{ marginTop: 12 }}>
        <div className="stat"><span className="eyebrow">Entries</span><b>{rows.length}</b></div>
        <div className="stat"><span className="eyebrow">In / out</span><b style={{ fontSize: 15 }}>{money(t.dep, 0)} / {money(t.wd, 0)}</b></div>
        <div className="stat"><span className="eyebrow">Net</span><b className={tone(t.net)}>{signed(t.net)}</b></div>
      </div>
      <TxList rows={rows} limit={more} />
      {rows.length > more && <button className="btn ghost block" style={{ marginTop: 14 }} onClick={() => setMore(more + 100)}>Show more</button>}
    </>
  );
}
