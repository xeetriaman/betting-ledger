"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, ListOrdered, Plus, Settings } from "lucide-react";
import { APPS } from "@/lib/apps";
import { useLedger } from "@/lib/ledger";
import QuickAdd from "./QuickAdd";
import { Badge } from "./ui";

const NAV = [["/", "Home", Home], ["/activity", "Activity", ListOrdered], ["/insights", "Insights", BarChart3], ["/settings", "Settings", Settings]];

export function Logo() {
  return <span className="logo" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 12.5 6 8l3 3 5-6.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>;
}

function Toast() {
  const { toast, setToast } = useLedger();
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(null), 5000); return () => clearTimeout(id); }, [toast, setToast]);
  if (!toast) return null;
  return <div className="toast" role="status">{toast.msg}{toast.undo && <button onClick={() => { const u = toast.undo; setToast(null); u(); }}>Undo</button>}</div>;
}

export default function Shell({ children }) {
  const path = usePathname();
  const { setSheet } = useLedger();
  const on = (href) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <div className="shell">
      <aside className="side">
        <div className="wordmark"><Logo />Ledger</div>
        {NAV.slice(0, 3).map(([href, l, I]) => <Link key={href} href={href} className={`nav ${on(href) ? "on" : ""}`}><I size={18} />{l}</Link>)}
        <div className="sub">Apps</div>
        {APPS.map((a) => <Link key={a.id} href={`/apps/${a.slug}`} className={`nav ${on(`/apps/${a.slug}`) ? "on" : ""}`}><Badge app={a.id} size="sm" />{a.name}</Link>)}
        <div style={{ flex: 1 }} />
        <Link href="/settings" className={`nav ${on("/settings") ? "on" : ""}`}><Settings size={18} />Settings</Link>
        <button className="btn primary add" onClick={() => setSheet({ mode: "add" })}><Plus size={18} />Add money</button>
      </aside>
      <main className="main">{children}</main>
      <nav className="tabbar" aria-label="Main">
        {NAV.slice(0, 2).map(([href, l, I]) => <Link key={href} href={href} className={on(href) ? "on" : ""}><I size={21} />{l}</Link>)}
        <button className="fab" onClick={() => setSheet({ mode: "add" })} aria-label="Add money"><Plus size={26} strokeWidth={2.4} /></button>
        {NAV.slice(2).map(([href, l, I]) => <Link key={href} href={href} className={on(href) ? "on" : ""}><I size={21} />{l}</Link>)}
      </nav>
      <QuickAdd />
      <Toast />
    </div>
  );
}
