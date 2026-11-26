"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { BarChart3, Home, List, Plus, Settings } from "lucide-react";
import { useLedger } from "@/lib/ledger";
import EntryDrawer from "./EntryDrawer";
import { Button, cn } from "./ui";

const NAV = [["/", "Overview", Home], ["/activity", "Activity", List], ["/insights", "Insights", BarChart3], ["/settings", "Settings", Settings]];

export const Wordmark = () => <span className="num font-semibold tracking-[0.18em] text-[13px]">LEDGER</span>;

export default function Shell({ children }) {
  const path = usePathname();
  const { setSheet } = useLedger();
  const on = (href) => (href === "/" ? path === "/" || path.startsWith("/apps") : path.startsWith(href));
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-line pt-[env(safe-area-inset-top)]">
        <div className="mx-auto max-w-[1200px] h-12 px-4 md:px-6 flex items-center gap-6">
          <Link href="/"><Wordmark /></Link>
          <nav className="hidden md:flex items-stretch h-12 gap-5 text-[13.5px]">
            {NAV.map(([href, l]) => <Link key={href} href={href} className={cn("flex items-center border-b-2 -mb-px", on(href) ? "border-ink text-ink font-medium" : "border-transparent text-mute hover:text-ink")}>{l}</Link>)}
          </nav>
          <div className="flex-1" />
          <Button size="sm" onClick={() => setSheet({ mode: "add" })}><Plus size={15} />New entry</Button>
        </div>
      </header>
      <main className="mx-auto max-w-[1200px] px-4 md:px-6 pt-5 pb-[calc(84px+env(safe-area-inset-bottom))] md:pb-12">{children}</main>
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-30 bg-white border-t border-line grid grid-cols-5 pb-[env(safe-area-inset-bottom)]" aria-label="Main">
        {NAV.slice(0, 2).map(([href, l, I]) => <Link key={href} href={href} className={cn("h-14 flex flex-col items-center justify-center gap-0.5 text-[10.5px]", on(href) ? "text-ink font-medium" : "text-mute")}><I size={19} />{l}</Link>)}
        <button onClick={() => setSheet({ mode: "add" })} aria-label="New entry" className="h-14 grid place-items-center"><span className="h-10 w-10 rounded-[4px] bg-ink text-white grid place-items-center"><Plus size={22} /></span></button>
        {NAV.slice(2).map(([href, l, I]) => <Link key={href} href={href} className={cn("h-14 flex flex-col items-center justify-center gap-0.5 text-[10.5px]", on(href) ? "text-ink font-medium" : "text-mute")}><I size={19} />{l}</Link>)}
      </nav>
      <EntryDrawer />
      <Toaster position="bottom-center" offset={{ bottom: 90 }} mobileOffset={{ bottom: 90 }} toastOptions={{ className: "!rounded-[4px] !font-sans" }} />
    </div>
  );
}
