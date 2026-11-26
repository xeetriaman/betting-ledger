"use client";
import { useEffect, useState } from "react";
import { Download, LogOut, ScanFace, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLedger } from "@/lib/ledger";
import { label } from "@/lib/apps";
import { fmtDay, dayKey, toLocalInput } from "@/lib/format";
import { forgetPasskeyHere, friendlyWebAuthnError, passkeySupported, registerPasskey } from "@/lib/passkey";

export default function SettingsPage() {
  const { user, limit, saveLimit, tx, notify } = useLedger();
  const [val, setVal] = useState(String(limit));
  const [keys, setKeys] = useState([]);
  const [msg, setMsg] = useState("");
  const [canFace, setCanFace] = useState(false);

  const loadKeys = async () => { const { data } = await supabase.from("passkeys").select("id, device, created_at, last_used_at").order("created_at"); setKeys(data || []); };
  useEffect(() => { loadKeys(); setCanFace(passkeySupported()); }, []);
  useEffect(() => setVal(String(limit)), [limit]);

  async function addKey() { setMsg(""); try { await registerPasskey(); await loadKeys(); notify("Face ID is on for this device"); } catch (e) { setMsg(friendlyWebAuthnError(e)); } }
  async function delKey(id) { await supabase.from("passkeys").delete().eq("id", id); forgetPasskeyHere(); await loadKeys(); notify("Face ID removed"); }

  function exportCsv() {
    const head = "date,time,app,promo_app,type,amount,note";
    const lines = tx.map((t) => { const [d, tm] = toLocalInput(t.occurred_at).split("T"); return [d, tm, t.app, t.promo || "", t.type, Number(t.amount).toFixed(2), (t.note || "").replace(/[",\n]/g, " ")].join(","); });
    const blob = new Blob([[head, ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `ledger-${dayKey(new Date())}.csv`; a.click();
  }

  return (
    <>
      <header className="top"><h1>Settings</h1></header>
      <div className="grid g2">
        <section className="card">
          <div className="cardhead"><h2>Weekly deposit limit</h2></div>
          <p className="mute" style={{ marginTop: 0, fontSize: 13.5 }}>The Home meter and the warning when you add a deposit use this. Weeks run Monday to Sunday.</p>
          <form style={{ display: "flex", gap: 10 }} onSubmit={async (e) => { e.preventDefault(); const v = Math.max(0, Math.round(parseFloat(val) * 100) / 100); if (!isNaN(v)) { await saveLimit(v); notify("Limit saved"); } }}>
            <input className="input" inputMode="decimal" value={val} onChange={(e) => setVal(e.target.value.replace(/[^0-9.]/g, ""))} aria-label="Weekly limit in dollars" />
            <button className="btn primary">Save</button>
          </form>
        </section>

        <section className="card">
          <div className="cardhead"><h2>Face ID</h2></div>
          {keys.map((k) => (
            <div className="row" key={k.id}>
              <ScanFace size={20} />
              <div className="grow"><div className="t">{k.device || "Device"}</div><div className="s">Added {fmtDay(dayKey(k.created_at))}{k.last_used_at ? ` · used ${fmtDay(dayKey(k.last_used_at))}` : ""}</div></div>
              <button className="iconbtn" aria-label="Remove" onClick={() => delKey(k.id)}><Trash2 size={16} /></button>
            </div>
          ))}
          {!keys.length && <p className="mute" style={{ marginTop: 0, fontSize: 13.5 }}>Not set up yet. Turn it on and you'll sign in with your face — no password.</p>}
          {canFace ? <button className="btn ghost block" style={{ marginTop: 10 }} onClick={addKey}><ScanFace size={18} />Add this device</button> : <p className="mute">This browser doesn't support Face ID sign-in.</p>}
          <p className="err">{msg}</p>
        </section>

        <section className="card">
          <div className="cardhead"><h2>Your data</h2></div>
          <p className="mute" style={{ marginTop: 0, fontSize: 13.5 }}>{tx.length} entries. History before 26 Nov 2026 came from your statements and records.</p>
          <button className="btn ghost block" onClick={exportCsv}><Download size={18} />Download CSV</button>
        </section>

        <section className="card">
          <div className="cardhead"><h2>Account</h2></div>
          <p className="mute" style={{ marginTop: 0, fontSize: 13.5 }}>Signed in as {user.email}</p>
          <button className="btn danger block" onClick={() => supabase.auth.signOut()}><LogOut size={18} />Sign out</button>
        </section>
      </div>
      <p className="mute" style={{ fontSize: 12.5, marginTop: 24 }}>Free, confidential support: Gambling Help Online 1800 858 858 · BetStop (betstop.gov.au) self-excludes you from every licensed Australian betting app.</p>
    </>
  );
}
