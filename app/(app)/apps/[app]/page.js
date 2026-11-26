"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, Flame, CalendarDays, Repeat, TrendingUp, Plus } from "lucide-react";
import { appBySlug } from "@/lib/apps";
import { useLedger } from "@/lib/ledger";
import { dayKey, fmtDay, money, signed, tone } from "@/lib/format";
import { cumulative, heatmap, inRange, monthly, patterns, promoSites, sizes, totals } from "@/lib/stats";
import { HBars, Heatmap, MonthBars, NetArea } from "@/components/Charts";
import TxList from "@/components/TxList";
import { Badge, Seg, Skeleton, Stat } from "@/components/ui";

const ICONS = { late: Clock, day: CalendarDays, chase: Repeat, max: Flame, streak: TrendingUp };
const RANGES = [["all", "All"], ["90d", "90D"], ["30d", "30D"]];

export default function AppPage() {
  const { app: slug } = useParams();
  const app = appBySlug(slug);
  const { tx, loading, setSheet } = useLedger();
  const [range, setRange] = useState("all");
  const [site, setSite] = useState("");
  const [more, setMore] = useState(30);

  const mine = useMemo(() => tx.filter((t) => app && t.app === app.id && (!site || t.promo === site)), [tx, app, site]);
  const scoped = useMemo(() => inRange(mine, range), [mine, range]);
  const t = totals(scoped);
  const deps = scoped.filter((x) => x.type === "deposit");
  const exact = deps.filter((x) => !x.approx);
  const biggest = deps.reduce((m, x) => Math.max(m, Number(x.amount)), 0);
  const lastDep = mine.find((x) => x.type === "deposit");
  const sites = useMemo(() => (app?.id === "Promo" ? promoSites(tx) : []), [tx, app]);

  if (!app) return <p>App not found. <Link className="link" href="/">Go home</Link></p>;
  if (loading) return <div className="grid"><Skeleton h={200} /><Skeleton h={240} /></div>;

  return (
    <>
      <header className="top">
        <Link href="/" className="iconbtn" aria-label="Back"><ArrowLeft size={19} /></Link>
        <Seg value={range} onChange={setRange} options={RANGES} />
      </header>

      <section className="hero" style={{ paddingBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Badge app={app.id} size="lg" />
          <div className="grow"><h1 style={{ margin: 0, fontSize: 24, letterSpacing: "-0.03em" }}>{site || app.name}</h1><div className="mute" style={{ fontSize: 13 }}>{t.nDep} deposits · {t.nWd} withdrawals</div></div>
          <button className="btn primary" style={{ height: 40, padding: "0 14px", fontSize: 14 }} onClick={() => setSheet({ mode: "add", preset: { app: app.id, promo: site || "" } })}><Plus size={16} />Add</button>
        </div>
        <div className={`big ${tone(t.net)}`} style={{ marginTop: 18 }}>{signed(t.net)}</div>
        <div className="meta"><span>Net result{range !== "all" ? ` · last ${range.replace("d", " days")}` : ""}</span></div>
        <NetArea data={cumulative(scoped)} height={170} />
      </section>

      <div className="stats" style={{ marginTop: 14 }}>
        <Stat label="Deposited" value={money(t.dep)} cls="neg" />
        <Stat label="Withdrawn" value={money(t.wd)} cls="pos" />
        <Stat label="Back per $1 in" value={t.dep ? "$" + (t.wd / t.dep).toFixed(2) : "–"} />
        <Stat label="Average deposit" value={t.nDep ? money(t.dep / t.nDep) : "–"} />
        <Stat label="Largest deposit" value={biggest ? money(biggest) : "–"} />
        <Stat label="Last deposit" value={lastDep ? fmtDay(dayKey(lastDep.occurred_at)) : "–"} />
      </div>

      {sites.length > 0 && (
        <section className="card" style={{ marginTop: 14 }}>
          <div className="cardhead"><h2>Promo apps</h2>{site && <button className="link" onClick={() => setSite("")}>Show all</button>}</div>
          {sites.map((s) => (
            <div key={s.name} className="row tap" role="button" tabIndex={0} onClick={() => setSite(site === s.name ? "" : s.name)} style={site === s.name ? { background: "rgba(198,244,50,.06)" } : undefined}>
              <Badge app="Promo" name={s.name} size="sm" />
              <div className="grow"><div className="t">{s.name}</div><div className="s">In {money(s.dep, 0)} · Out {money(s.wd, 0)}</div></div>
              <span className={`num ${tone(s.net)}`}>{signed(s.net)}</span>
            </div>
          ))}
        </section>
      )}

      <div className="grid g2" style={{ marginTop: 14 }}>
        <section className="card"><div className="cardhead"><h2>Month by month</h2></div><MonthBars data={monthly(scoped)} /></section>
        <section className="card"><div className="cardhead"><h2>When you deposit</h2><span className="eyebrow">{exact.length} timed</span></div><Heatmap grid={heatmap(scoped)} /></section>
        <section className="card"><div className="cardhead"><h2>Deposit sizes</h2></div>
          <HBars color="var(--ink2)" rows={sizes(scoped).map((s) => ({ k: s.name, v: s.sum, lab: `${s.n} · ${money(s.sum, 0)}` }))} />
        </section>
        <section className="card"><div className="cardhead"><h2>Patterns</h2></div>
          {patterns(scoped).length ? patterns(scoped).map((p) => { const I = ICONS[p.k]; return <div className="insight" key={p.k}><span className="ic"><I size={17} /></span><div><b>{p.title}</b><span>{p.body}</span></div></div>; })
            : <p className="mute">Patterns appear after a few deposits with exact times.</p>}
        </section>
      </div>

      <div className="cardhead" style={{ margin: "26px 2px 0" }}><h2 style={{ fontSize: 17 }}>Transactions</h2><span className="eyebrow">{scoped.length}</span></div>
      <TxList rows={scoped} limit={more} />
      {scoped.length > more && <button className="btn ghost block" style={{ marginTop: 14 }} onClick={() => setMore(more + 60)}>Show more</button>}
    </>
  );
}
