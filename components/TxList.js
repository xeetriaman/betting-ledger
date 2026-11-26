"use client";
import { label } from "@/lib/apps";
import { useLedger } from "@/lib/ledger";
import { dayLabel, fmtTime, money, signed } from "@/lib/format";
import { groupByDay } from "@/lib/stats";
import { Badge } from "./ui";

export function TxRow({ t }) {
  const { setSheet } = useLedger();
  const dep = t.type === "deposit";
  return (
    <div className="row tap" role="button" tabIndex={0} onClick={() => setSheet({ mode: "edit", row: t })} onKeyDown={(e) => e.key === "Enter" && setSheet({ mode: "edit", row: t })}>
      <Badge app={t.app} name={t.promo} size="sm" />
      <div className="grow">
        <div className="t">{label(t)}</div>
        <div className="s">{dep ? "Deposit" : "Withdrawal"} · {t.approx ? <span className="pill">{t.note?.startsWith("Monthly") ? "Month total" : "Summary"}</span> : fmtTime(t.occurred_at)}{!t.approx && t.note ? ` · ${t.note}` : ""}</div>
      </div>
      <div className={`num right ${dep ? "" : "pos"}`} style={{ fontSize: 15 }}>{dep ? "−" : "+"}{money(t.amount)}</div>
    </div>
  );
}

export default function TxList({ rows, limit = Infinity }) {
  const days = groupByDay(rows.slice(0, limit));
  if (!rows.length) return <p className="mute" style={{ padding: "20px 0" }}>Nothing here yet.</p>;
  return days.map((d) => (
    <section key={d.k}>
      <div className="dayhead"><span>{dayLabel(d.k)}</span><span className={`num ${d.net < 0 ? "neg" : d.net > 0 ? "pos" : ""}`}>{signed(d.net)}</span></div>
      <div className="card" style={{ padding: "4px 16px" }}>{d.rows.map((t) => <TxRow key={t.id} t={t} />)}</div>
    </section>
  ));
}
