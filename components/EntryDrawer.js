"use client";
import { useEffect, useMemo, useState } from "react";
import { Drawer } from "vaul";
import { AlertTriangle } from "lucide-react";
import { APPS, label } from "@/lib/apps";
import { useLedger } from "@/lib/ledger";
import { fromLocalInput, money, toLocalInput } from "@/lib/format";
import { thisWeek } from "@/lib/stats";
import { AppTag, Button, Segmented, cn } from "./ui";

const field = "h-11 w-full min-w-0 rounded-[4px] border border-line2 bg-white px-3 text-[16px] outline-none focus:border-ink";

export default function EntryDrawer() {
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
  }, [sheet, editing]);

  const promos = useMemo(() => { const s = []; for (const t of tx) if (t.app === "Promo" && t.promo && !s.includes(t.promo)) s.push(t.promo); return s.slice(0, 8); }, [tx]);
  const week = useMemo(() => thisWeek(tx).total, [tx]);

  const value = Math.round(parseFloat(amount) * 100) / 100;
  const valid = value > 0 && value < 1e6 && (app !== "Promo" || promo.trim());
  const after = week + (type === "deposit" && !editing ? value || 0 : 0);
  const over = type === "deposit" && !editing && value > 0 && after > limit;

  async function save(e) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true); setErr("");
    const row = { type, app, promo: app === "Promo" ? promo.trim().slice(0, 40) : null, amount: value, occurred_at: fromLocalInput(when), note: note.trim().slice(0, 200) || null };
    try {
      if (editing) { await update(editing.id, row); notify("Changes saved"); }
      else { const saved = await add({ ...row, source: "app" }); notify(`${type === "deposit" ? "Deposit" : "Withdrawal"} ${money(value)} saved`, async () => { await remove(saved.id); notify("Undone"); }); }
      setSheet(null);
    } catch (e2) { setErr(e2.message); setBusy(false); }
  }

  async function del() {
    if (!confirmDel) return setConfirmDel(true);
    setBusy(true);
    try { const old = await remove(editing.id); setSheet(null); notify("Entry deleted", async () => { const { id, user_id, created_at, ...rest } = old; await add(rest); notify("Restored"); }); }
    catch (e2) { setErr(e2.message); setBusy(false); }
  }

  return (
    <Drawer.Root open={!!sheet} onOpenChange={(o) => !o && setSheet(null)}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[480px] rounded-t-[10px] border border-line bg-white outline-none max-h-[94dvh] flex flex-col">
          <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-line2" />
          <form onSubmit={save} className="overflow-y-auto overflow-x-hidden px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between mb-3">
              <Drawer.Title className="text-[15px] font-semibold">{editing ? "Edit entry" : "New entry"}</Drawer.Title>
              <Segmented value={type} onChange={setType} options={[["deposit", "Deposit"], ["withdrawal", "Withdrawal"]]} />
            </div>
            <Drawer.Description className="sr-only">Record a deposit or withdrawal</Drawer.Description>

            <div className="label mb-2">App</div>
            <div className="grid grid-cols-5 border border-line rounded-[4px] overflow-hidden mb-3">
              {APPS.map((a) => (
                <button type="button" key={a.id} onClick={() => setApp(a.id)} aria-pressed={app === a.id}
                  className={cn("flex flex-col items-center gap-1.5 py-2.5 text-[11px] font-medium border-r border-line last:border-r-0", app === a.id ? "bg-ink text-white" : "text-sub hover:bg-soft")}>
                  <AppTag app={a.id} size={24} />{a.id === "Promo" ? "Promo" : a.name}
                </button>
              ))}
            </div>

            {app === "Promo" && (
              <div className="mb-3">
                <input className={field} value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="Promo app name, e.g. Boost Bet" aria-label="Promo app name" />
                {promos.length > 0 && <div className="flex flex-wrap gap-1.5 mt-2">{promos.map((p) => <button type="button" key={p} onClick={() => setPromo(p)} className={cn("h-7 px-2.5 rounded-[3px] border text-[12px]", promo === p ? "bg-ink text-white border-ink" : "border-line2 text-sub")}>{p}</button>)}</div>}
              </div>
            )}

            <div className="label mb-2">Amount</div>
            <div className="flex items-center border border-line2 rounded-[4px] focus-within:border-ink mb-2">
              <span className="num pl-3 text-mute text-[22px]">$</span>
              <input inputMode="decimal" autoFocus={!editing} placeholder="0.00" value={amount} aria-label="Amount in dollars"
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1").replace(/(\.\d{2}).+/, "$1"))}
                className={cn("num h-14 flex-1 min-w-0 w-full bg-transparent px-2 text-[28px] font-medium outline-none", type === "deposit" ? "text-down" : "text-up")} />
            </div>
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {[10, 20, 50, 100].map((v) => <button type="button" key={v} onClick={() => setAmount(String((parseFloat(amount) || 0) + v))} className="h-8 rounded-[3px] border border-line2 num text-[13px] hover:bg-soft">+{v}</button>)}
            </div>

            {over && <div className="flex gap-2 items-start rounded-[4px] border border-down/25 bg-downbg text-[#9b1c13] text-[13px] p-2.5 mb-3"><AlertTriangle size={16} className="shrink-0 mt-0.5" /><span>Takes this week to <b className="num">{money(after)}</b> — <b className="num">{money(after - limit)}</b> over your {money(limit, 0)} limit.</span></div>}

            <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-2 mb-3">
              <label className="block min-w-0"><span className="label block mb-2">Date & time</span><input type="datetime-local" className={cn(field, "text-[14px]")} value={when} onChange={(e) => setWhen(e.target.value)} required /></label>
              <label className="block min-w-0"><span className="label block mb-2">Note</span><input className={cn(field, "text-[14px]")} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" /></label>
            </div>
            {editing?.approx && <p className="text-[12px] text-mute mb-3">From {editing.note || "a monthly total"} — exact date unknown.</p>}
            {err && <p className="text-down text-[13px] mb-2" role="alert">{err}</p>}
            <Button size="lg" className="w-full" disabled={!valid || busy}>{busy ? "Saving…" : editing ? "Save changes" : `Save ${type}`}</Button>
            {editing && <Button type="button" variant="danger" size="lg" className="w-full mt-2" onClick={del} disabled={busy}>{confirmDel ? `Confirm delete ${label(editing)} ${money(editing.amount)}` : "Delete entry"}</Button>}
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
