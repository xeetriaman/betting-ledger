"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScanFace } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { friendlyWebAuthnError, hasPasskeyHere, passkeySupported, signInWithPasskey } from "@/lib/passkey";
import { Logo } from "@/components/Shell";

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
    setCanFace(passkeySupported());
    setKnownFace(hasPasskeyHere());
  }, [router]);

  async function face() {
    setBusy(true); setErr("");
    try { await signInWithPasskey(); router.replace("/"); }
    catch (e) { setErr(friendlyWebAuthnError(e)); setBusy(false); }
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    if (mode === "up") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) { setErr(/closed/i.test(error.message) ? "This ledger already has an owner. Sign in instead." : error.message); setBusy(false); return; }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setErr(mode === "up" ? "Account created — sign in to continue." : "Wrong email or password."); setBusy(false); if (mode === "up") setMode("in"); return; }
    router.replace("/");
  }

  return (
    <main className="auth">
      <div className="authcard">
        <Logo />
        <div><h1>{mode === "up" ? "Create your ledger" : "Welcome back"}</h1><p>Every deposit and withdrawal, one place.</p></div>

        {canFace && mode === "in" && (
          <>
            <button className={`btn block ${knownFace ? "primary" : "ghost"}`} onClick={face} disabled={busy}><ScanFace size={20} />Sign in with Face ID</button>
            <div className="divider">or use your password</div>
          </>
        )}

        <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
          <div className="field"><label htmlFor="email">Email</label><input id="email" className="input" type="email" autoComplete="username webauthn" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div className="field"><label htmlFor="pw">Password</label><input id="pw" className="input" type="password" autoComplete={mode === "up" ? "new-password" : "current-password"} minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          <p className="err" role="alert">{err}</p>
          <button className={`btn block ${knownFace && mode === "in" ? "ghost" : "primary"}`} disabled={busy}>{busy ? "One moment…" : mode === "up" ? "Create account" : "Sign in"}</button>
        </form>
        <button className="link" style={{ justifySelf: "center" }} onClick={() => { setMode(mode === "up" ? "in" : "up"); setErr(""); }}>
          {mode === "up" ? "Already set up? Sign in" : "First time here? Create your account"}
        </button>
      </div>
    </main>
  );
}
