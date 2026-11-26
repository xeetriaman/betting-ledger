"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { APPS, label } from "@/lib/apps";
import { useLedger } from "@/lib/ledger";
import { fromLocalInput, money, toLocalInput } from "@/lib/format";
import { thisWeek } from "@/lib/stats";
import { Badge } from "./ui";

export default function QuickAdd() {
  const { sheet, setSheet, tx, limit, add, update, remove, notify } = useLedger();
  const editing = sheet?.mode === "edit" ? sheet.row : null;
  const [type, setType] = useState("deposit");
  const [app, setApp] = useState("bet365");
  const [promo, setPromo] = useState("");
  const [amount, setAmount] = useState("");
  const [when, setWhen] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const amtRef = useRef(null);

  useEffect(() => {
    if (!sheet) return;
    const r = editing;
    setType(r?.type || sheet.preset?.type || "deposit");
    setApp(r?.app || sheet.preset?.app || "bet365");
    setPromo(r?.promo || sheet.preset?.promo || "");
    setAmount(r ? String(Number(r.amount)) : "");
    setWhen(toLocalInput(r?.occurred_at || new Date()));
    setNote(r?.note || "");
    setErr(""); setConfirmDel(false); setBusy(false);
    const id = setTimeout(() => amtRef.current?.focus(), 250);
    return () => clearTimeout(id);
  }, [sheet, editing]);

  useEffect(() => {
    if (!sheet) return;
    const onKey = (e) => e.key === "Escape" && setSheet(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet, setSheet]);

  const recentPromos = useMemo(() => {
    const s = []; for (const t of tx) if (t.app === "Promo" && t.promo && !s.includes(t.promo)) s.push(t.promo);
    return s.slice(0, 8);
  }, [tx]);

  const week = useMemo(() => thisWeek(tx).total, [tx]);
  if (!sheet) return null;

  const value = Math.round(parseFloat(amount) * 100) / 100;
  const valid = value > 0 && value < 1000000 && (app !== "Promo" || promo.trim());
  const after = week + (type === "deposit" && !editing ? value || 0 : 0);
  const over = type === "deposit" && !editing && value > 0 && after > limit;

  async function save(e) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true); setErr("");
    const row = { type, app, promo: app === "Promo" ? promo.trim().slice(0, 40) : null, amount: value, occurred_at: fromLocalInput(when), note: note.trim().slice(0, 200) || null };
    try {
      if (editing) { await update(editing.id, { ...row, approx: editing.approx && editing.occurred_at === row.occurred_at }); notify("Changes saved"); }
      else {
        const saved = await add({ ...row, source: "app" });
        notify(`${type === "deposit" ? "Deposit" : "Withdrawal"} of ${money(value)} saved`, async () => { await remove(saved.id); notify("Undone"); });
      }
      setSheet(null);
    } catch (e2) { setErr(e2.message); setBusy(false); }
  }

  async function del() {
    if (!confirmDel) { setConfirmDel(true); return; }
    setBusy(true);
    try {
      const old = await remove(editing.id);
      setSheet(null);
      notify("Entry deleted", async () => { const { id, user_id, created_at, ...rest } = old; await add(rest); notify("Restored"); });
    } catch (e2) { setErr(e2.message); setBusy(false); }
  }

  return (
    <div className="scrim" onClick={(e) => e.target === e.currentTarget && setSheet(null)}>
      <form className="sheet" onSubmit={save} role="dialog" aria-modal="true" aria-label={editing ? "Edit entry" : "Add money"}>
        <div className="grab" />
        <div className="sheethead">
          <h3>{editing ? "Edit entry" : "Add money"}</h3>
          <button type="button" className="iconbtn" onClick={() => setSheet(null)} aria-label="Close"><X size={18} /></button>
        </div>

        <div className="typeseg">
          <button type="button" className={`dep ${type === "deposit" ? "on" : ""}`} onClick={() => setType("deposit")}>Deposit</button>
          <button type="button" className={`wd ${type === "withdrawal" ? "on" : ""}`} onClick={() => setType("withdrawal")}>Withdrawal</button>
        </div>

        <div className="apppick">
          {APPS.map((a) => (
            <button type="button" key={a.id} className={app === a.id ? "on" : ""} onClick={() => setApp(a.id)} aria-pressed={app === a.id}>
              <Badge app={a.id} size="sm" />{a.id === "Promo" ? "Promo" : a.name}
            </button>
          ))}
        </div>

        {app === "Promo" && (
          <div className="field" style={{ marginBottom: 12 }}>
            <label htmlFor="promo">Which promo app?</label>
            <input id="promo" className="input" value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="e.g. Boost Bet" autoComplete="off" />
            {recentPromos.length > 0 && <div className="chips" style={{ marginTop: 4 }}>{recentPromos.map((p) => <button type="button" key={p} className={`chip ${promo === p ? "on" : ""}`} onClick={() => setPromo(p)}>{p}</button>)}</div>}
          </div>
        )}

        <label className="amount">
          <span>$</span>
          <input ref={amtRef} inputMode="decimal" placeholder="0" value={amount} aria-label="Amount in dollars"
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1").replace(/(\.\d{2}).+/, "$1"))} />
        </label>
        <div className="quick">
          {[10, 20, 50, 100].map((v) => <button type="button" key={v} onClick={() => setAmount(String((parseFloat(amount) || 0) + v))}>+{v}</button>)}
        </div>

        {over && (
          <div className="warnbox"><AlertTriangle size={18} style={{ flex: "none", marginTop: 1 }} />
            <span>This takes you to <b>{money(after)}</b> this week, <b>{money(after - limit)}</b> over your {money(limit, 0)} limit.</span>
          </div>
        )}

        <div className="more">
          <div className="field"><label htmlFor="when">When</label><input id="when" className="input" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} required /></div>
          <div className="field"><label htmlFor="note">Note</label><input id="note" className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" /></div>
        </div>
        {editing?.approx && <p className="mute" style={{ fontSize: 12.5, margin: "-4px 0 12px" }}>From {editing.note || "a monthly total"} — the exact date isn't known.</p>}

        <p className="err" role="alert">{err}</p>
        <button className="btn primary block" disabled={!valid || busy}>{busy ? "Saving…" : editing ? "Save changes" : `Save ${type}`}</button>
        {editing && <button type="button" className="btn danger block" style={{ marginTop: 10 }} onClick={del} disabled={busy}><Trash2 size={17} />{confirmDel ? `Tap again to delete ${label(editing)} ${money(editing.amount)}` : "Delete entry"}</button>}
      </form>
    </div>
  );
}
