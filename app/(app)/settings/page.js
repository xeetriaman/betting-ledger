"use client";
import { useEffect, useState } from "react";
import { Download, LogOut, ScanFace, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLedger } from "@/lib/ledger";
import { fmtDay, dayKey, toLocalInput } from "@/lib/format";
import { forgetPasskeyHere, friendlyWebAuthnError, passkeySupported, registerPasskey } from "@/lib/passkey";
import { Button, Panel } from "@/components/ui";

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
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([[head, ...lines].join("\n")], { type: "text/csv" })); a.download = `ledger-${dayKey(new Date())}.csv`; a.click();
  }

  return (
    <>
      <h1 className="text-[22px] font-semibold tracking-tight mb-4">Settings</h1>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Weekly deposit limit">
          <p className="text-[13px] text-sub mb-3">Used for the week meter and the warning when you add a deposit. Weeks run Monday to Sunday.</p>
          <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); const v = Math.max(0, Math.round(parseFloat(val) * 100) / 100); if (!isNaN(v)) { await saveLimit(v); notify("Limit saved"); } }}>
            <div className="flex flex-1 items-center border border-line2 rounded-[4px] focus-within:border-ink"><span className="num pl-3 text-mute">$</span><input className="num h-10 flex-1 px-2 outline-none text-[16px]" inputMode="decimal" value={val} onChange={(e) => setVal(e.target.value.replace(/[^0-9.]/g, ""))} aria-label="Weekly limit" /></div>
            <Button>Save</Button>
          </form>
        </Panel>

        <Panel title="Face ID" flush>
          <div className="divide-y divide-line">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center gap-3 px-3 h-12">
                <ScanFace size={17} className="text-sub" />
                <div className="flex-1 text-[13.5px]">{k.device || "Device"} <span className="text-mute text-[12px]">· added {fmtDay(dayKey(k.created_at))}{k.last_used_at ? ` · used ${fmtDay(dayKey(k.last_used_at))}` : ""}</span></div>
                <Button variant="ghost" size="icon" aria-label="Remove" onClick={() => delKey(k.id)}><Trash2 size={15} /></Button>
              </div>
            ))}
            {!keys.length && <p className="px-3 py-3 text-[13px] text-sub">Not set up. Turn it on to sign in with your face instead of a password.</p>}
          </div>
          <div className="p-3 border-t border-line">
            {canFace ? <Button variant="outline" className="w-full" onClick={addKey}><ScanFace size={16} />Add this device</Button> : <p className="text-[13px] text-mute">This browser doesn't support Face ID sign-in.</p>}
            {msg && <p className="text-down text-[13px] mt-2">{msg}</p>}
          </div>
        </Panel>

        <Panel title="Data">
          <p className="text-[13px] text-sub mb-3">{tx.length} entries. History before 26 Nov 2026 came from your statements and records.</p>
          <Button variant="outline" className="w-full" onClick={exportCsv}><Download size={16} />Download CSV</Button>
        </Panel>

        <Panel title="Account">
          <p className="text-[13px] text-sub mb-3">Signed in as {user.email}</p>
          <Button variant="danger" className="w-full" onClick={() => supabase.auth.signOut()}><LogOut size={16} />Sign out</Button>
        </Panel>
      </div>
      <p className="text-[12px] text-mute mt-6">Free, confidential support: Gambling Help Online 1800 858 858 · BetStop (betstop.gov.au) self-excludes you from every licensed Australian betting app.</p>
    </>
  );
}
