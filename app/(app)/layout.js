"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LedgerProvider } from "@/lib/ledger";
import Shell from "@/components/Shell";

export default function AppLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(undefined);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
      else setUser(data.session.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) router.replace("/login");
      else setUser(session.user);
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);
  if (!user) return <div style={{ minHeight: "100dvh", background: "var(--bg)" }} />;
  return <LedgerProvider user={user}><Shell>{children}</Shell></LedgerProvider>;
}
