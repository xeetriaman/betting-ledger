"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScanFace } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { friendlyWebAuthnError, hasPasskeyHere, passkeySupported, signInWithPasskey } from "@/lib/passkey";
import { Wordmark } from "@/components/Shell";
import { Button, cn } from "@/components/ui";

const field = "h-11 w-full rounded-[4px] border border-line2 bg-white px-3 text-[16px] outline-none focus:border-ink";

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [canFace, setCanFace] = useState(false);
  const [knownFace, setKnownFace] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => data.session && router.replace("/"));
    setCanFace(passkeySupported()); setKnownFace(hasPasskeyHere());
  }, [router]);

  async function face() {
    setBusy(true); setErr("");
    try { await signInWithPasskey(); router.replace("/"); } catch (e) { setErr(friendlyWebAuthnError(e)); setBusy(false); }
  }
  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr("");
    if (mode === "up") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) { setErr(/closed/i.test(error.message) ? "This ledger already has an owner. Sign in instead." : error.message); setBusy(false); return; }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setErr(mode === "up" ? "Account created — sign in to continue." : "Wrong email or password."); setBusy(false); if (mode === "up") setMode("in"); return; }
    router.replace("/");
  }

  return (
    <main className="min-h-dvh grid place-items-center p-5 bg-soft">
      <div className="w-full max-w-[380px] border border-line rounded-[4px] bg-white">
        <div className="h-12 px-4 flex items-center border-b border-line"><Wordmark /></div>
        <div className="p-4 grid gap-3">
          <div><h1 className="text-[20px] font-semibold tracking-tight">{mode === "up" ? "Create your ledger" : "Sign in"}</h1><p className="text-[13px] text-mute">Deposits and withdrawals across every app.</p></div>
          {canFace && mode === "in" && (
            <>
              <Button variant={knownFace ? "primary" : "outline"} size="lg" className="w-full" onClick={face} disabled={busy}><ScanFace size={18} />Sign in with Face ID</Button>
              <div className="flex items-center gap-3 text-[11px] text-mute uppercase tracking-[0.08em]"><span className="h-px flex-1 bg-line" />or password<span className="h-px flex-1 bg-line" /></div>
            </>
          )}
          <form onSubmit={submit} className="grid gap-3">
            <label><span className="label block mb-1.5">Email</span><input className={field} type="email" autoComplete="username webauthn" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
            <label><span className="label block mb-1.5">Password</span><input className={field} type="password" minLength={8} autoComplete={mode === "up" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
            {err && <p className="text-down text-[13px]" role="alert">{err}</p>}
            <Button size="lg" variant={knownFace && mode === "in" ? "outline" : "primary"} className="w-full" disabled={busy}>{busy ? "One moment…" : mode === "up" ? "Create account" : "Sign in"}</Button>
          </form>
          <button className={cn("text-[12.5px] text-sub hover:text-ink justify-self-center")} onClick={() => { setMode(mode === "up" ? "in" : "up"); setErr(""); }}>{mode === "up" ? "Already set up? Sign in" : "First time? Create your account"}</button>
        </div>
      </div>
    </main>
  );
}
