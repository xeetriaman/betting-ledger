"use client";
import { useMemo } from "react";
import { Clock, CalendarDays, Repeat, Flame, TrendingUp } from "lucide-react";
import { useLedger } from "@/lib/ledger";
import { fmtMonth, money, signed, tone } from "@/lib/format";
import { byApp, dated, heatmap, monthly, patterns, weekly } from "@/lib/stats";
import { HBars, Heatmap, MonthBars, WeekBars } from "@/components/Charts";
import { Skeleton } from "@/components/ui";

const ICONS = { late: Clock, day: CalendarDays, chase: Repeat, max: Flame, streak: TrendingUp };

export default function Insights() {
  const { tx, limit, loading } = useLedger();
  const weeks = useMemo(() => weekly(tx, 12), [tx]);
  const months = useMemo(() => monthly(dated(tx)), [tx]);
  const apps = useMemo(() => byApp(tx), [tx]);
  const pats = useMemo(() => patterns(tx), [tx]);
  if (loading) return <Skeleton h={400} />;
  const over = weeks.filter((w) => w.dep > limit).length;

  return (
    <>
      <header className="top"><div><div className="eyebrow">Last 12 weeks</div><h1>{over ? `Over your limit ${over} of 12 weeks` : "Within your limit every week"}</h1></div></header>
      <div className="grid g2">
        <section className="card span2"><div className="cardhead"><h2>Weekly deposits vs limit</h2><span className="eyebrow">Dashed line = your {money(limit, 0)} limit · red = over</span></div><WeekBars data={weeks} limit={limit} /></section>
        <section className="card"><div className="cardhead"><h2>Net by app</h2></div><HBars rows={apps.map((a) => ({ k: a.app.name, v: a.net }))} /></section>
        <section className="card"><div className="cardhead"><h2>Share of deposits</h2></div><HBars color="var(--ink2)" rows={apps.map((a) => ({ k: a.app.name, v: a.dep, lab: money(a.dep, 0) }))} /></section>
        <section className="card"><div className="cardhead"><h2>When you deposit</h2><span className="eyebrow">All apps</span></div><Heatmap grid={heatmap(tx)} /></section>
        <section className="card"><div className="cardhead"><h2>Patterns</h2></div>
          {pats.map((p) => { const I = ICONS[p.k]; return <div className="insight" key={p.k}><span className="ic"><I size={17} /></span><div><b>{p.title}</b><span>{p.body}</span></div></div>; })}
        </section>
        <section className="card span2"><div className="cardhead"><h2>Month by month</h2></div><MonthBars data={months} />
          <div style={{ marginTop: 10 }}>
            {[...months].reverse().map((m) => (
              <div className="row" key={m.k}><span className="grow">{fmtMonth(m.k, true)}</span><span className="num mute" style={{ fontSize: 13 }}>{money(m.dep, 0)} in · {money(m.wd, 0)} out</span><span className={`num ${tone(m.net)}`} style={{ width: 96, textAlign: "right" }}>{signed(m.net)}</span></div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
