"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, ScanFace, Settings, X } from "lucide-react";
import { APPS } from "@/lib/apps";
import { useLedger } from "@/lib/ledger";
import { fmtDay, money, signed, todayKey, tone } from "@/lib/format";
import { byApp, cumulative, dated, inRange, monthly, thisWeek, totals } from "@/lib/stats";
import { friendlyWebAuthnError, hasPasskeyHere, passkeySupported, registerPasskey } from "@/lib/passkey";
import { NetArea } from "@/components/Charts";
import TxList from "@/components/TxList";
import { Badge, Seg, Skeleton } from "@/components/ui";

const RANGES = [["all", "All time"], ["month", "Month"], ["30d", "30D"], ["week", "Week"]];

function FaceBanner() {
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState("");
  useEffect(() => { try { setShow(passkeySupported() && !hasPasskeyHere() && localStorage.getItem("ledger.faceid.skip") !== "1"); } catch {} }, []);
  if (!show) return null;
  return (
    <div className="banner">
      <span className="logo" style={{width:40,height:40,borderRadius:12}}><ScanFace size={22} /></span>
      <div className="grow"><b>Turn on Face ID</b><span>{msg || "Sign in instantly next time — no password."}</span></div>
      <button className="btn primary" style={{ height: 38, padding: "0 14px", fontSize: 14 }} onClick={async () => { try { await registerPasskey(); setShow(false); } catch (e) { setMsg(friendlyWebAuthnError(e)); } }}>Turn on</button>
      <button className="iconbtn" style={{ width: 34, height: 34 }} aria-label="Not now" onClick={() => { try { localStorage.setItem("ledger.faceid.skip", "1"); } catch {} setShow(false); }}><X size={15} /></button>
    </div>
  );
}

export default function Home() {
  const { tx, limit, loading, error } = useLedger();
  const [range, setRange] = useState("all");
  const scoped = useMemo(() => inRange(tx, range), [tx, range]);
  const t = useMemo(() => totals(scoped), [scoped]);
  const curve = useMemo(() => cumulative(scoped), [scoped]);
  const apps = useMemo(() => byApp(tx), [tx]);
  const week = useMemo(() => thisWeek(tx), [tx]);
  const months = useMemo(() => monthly(dated(tx)), [tx]);
  const thisM = months[months.length - 1], prevM = months[months.length - 2];
  const totalDep = apps.reduce((s, a) => s + a.dep, 0);
  const today = todayKey();
  const dayMax = Math.max(limit / 3, ...week.days.map((d) => d.dep));
  const pct = limit > 0 ? Math.min(100, (week.total / limit) * 100) : 100;

  if (loading) return <div className="grid"><Skeleton h={300} /><Skeleton h={140} /><Skeleton h={220} /></div>;

  return (
    <>
      <header className="top">
        <div><div className="eyebrow">{fmtDay(today, { weekday: "long", day: "numeric", month: "long" })}</div><h1>Overview</h1></div>
        <Link href="/settings" className="iconbtn" aria-label="Settings"><Settings size={19} /></Link>
      </header>
      {error && <div className="warnbox">{error}</div>}
      <FaceBanner />

      <section className={`hero ${t.net < 0 ? "down" : "up"}`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span className="eyebrow">Net result · {RANGES.find((r) => r[0] === range)[1].toLowerCase()}</span>
          <Seg value={range} onChange={setRange} options={RANGES} />
        </div>
        <div className={`big ${tone(t.net)}`}>{signed(t.net)}</div>
        <div className="meta"><span>Deposited <b className="num">{money(t.dep)}</b></span><span>Withdrawn <b className="num">{money(t.wd)}</b></span><span className="mute">{t.nDep + t.nWd} entries</span></div>
        <NetArea data={curve} />
      </section>

      <div className="grid g2" style={{ marginTop: 14 }}>
        <section className="card">
          <div className="cardhead"><h2>This week</h2><span className="eyebrow">Limit {money(limit, 0)}</span></div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
            <span className="num" style={{ fontSize: 30, letterSpacing: "-0.04em" }}>{money(week.total)}</span>
            <span className={week.total > limit ? "neg" : "mute"} style={{ fontSize: 13, fontWeight: 550 }}>{week.total > limit ? `${money(week.total - limit)} over` : `${money(limit - week.total)} left`}</span>
          </div>
          <div className={`meter ${week.total > limit ? "over" : ""}`} style={{ marginTop: 10 }}><i style={{ width: `${pct}%` }} /></div>
          <div className="days">
            {week.days.map((d, i) => (
              <div key={d.k} title={`${fmtDay(d.k)}: ${money(d.dep)}`}>
                <span className={`bar ${d.dep ? "has" : ""} ${d.dep > limit ? "over" : ""} ${d.k === today ? "today" : ""}`} style={{ height: Math.max(4, Math.round((d.dep / dayMax) * 44)) }} />
                <small>{"MTWTFSS"[i]}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="cardhead"><h2>{thisM ? `This month` : "Months"}</h2>{prevM && <span className="eyebrow">vs last month</span>}</div>
          {thisM ? (
            <>
              <div className="num" style={{ fontSize: 30, letterSpacing: "-0.04em" }}><span className={tone(thisM.net)}>{signed(thisM.net)}</span></div>
              <div className="row"><span className="grow mute">Deposited</span><span className="num">{money(thisM.dep)}</span>{prevM && <span className={`num ${thisM.dep > prevM.dep ? "neg" : "pos"}`} style={{ fontSize: 12.5, width: 74, textAlign: "right" }}>{thisM.dep > prevM.dep ? "▲" : "▼"} {money(Math.abs(thisM.dep - prevM.dep), 0)}</span>}</div>
              <div className="row"><span className="grow mute">Withdrawn</span><span className="num">{money(thisM.wd)}</span>{prevM && <span className="num mute" style={{ fontSize: 12.5, width: 74, textAlign: "right" }}>{money(prevM.wd, 0)} prev</span>}</div>
            </>
          ) : <p className="mute">No entries yet.</p>}
        </section>
      </div>

      <div className="cardhead" style={{ margin: "26px 2px 12px" }}><h2 style={{ fontSize: 17 }}>Your apps</h2><Link className="link" href="/insights">Compare <ChevronRight size={15} /></Link></div>
      <div className="grid g3">
        {apps.map(({ app, dep, wd, net, nDep }) => (
          <Link key={app.id} href={`/apps/${app.slug}`} className="appcard">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Badge app={app.id} />
              <div className="grow"><div style={{ fontWeight: 600 }}>{app.name}</div><div className="mute" style={{ fontSize: 12.5 }}>{nDep} deposits</div></div>
              <span className={`num ${tone(net)}`} style={{ fontSize: 17 }}>{signed(net)}</span>
            </div>
            <div className="share" title={`${Math.round((dep / totalDep) * 100)}% of all deposits`}><i style={{ width: `${(dep / totalDep) * 100}%`, background: app.bg }} /></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }} className="mute"><span>In <span className="num">{money(dep, 0)}</span></span><span>Out <span className="num">{money(wd, 0)}</span></span></div>
          </Link>
        ))}
      </div>

      <div className="cardhead" style={{ margin: "26px 2px 0" }}><h2 style={{ fontSize: 17 }}>Recent</h2><Link className="link" href="/activity">See all <ChevronRight size={15} /></Link></div>
      <TxList rows={tx} limit={8} />
    </>
  );
}
