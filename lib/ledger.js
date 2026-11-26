"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

const Ctx = createContext(null);
export const useLedger = () => useContext(Ctx);

const byTimeDesc = (a, b) => new Date(b.occurred_at) - new Date(a.occurred_at);

export function LedgerProvider({ user, children }) {
  const [tx, setTx] = useState([]);
  const [limit, setLimit] = useState(40);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sheet, setSheet] = useState(null); // { mode: 'add'|'edit', preset }
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    const [t, s] = await Promise.all([
      supabase.from("transactions").select("*").order("occurred_at", { ascending: false }),
      supabase.from("settings").select("weekly_limit").maybeSingle(),
    ]);
    if (t.error) setError("Couldn't load your ledger. Check your connection.");
    else { setTx(t.data); setError(""); }
    if (s.data) setLimit(Number(s.data.weekly_limit));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const onFocus = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onFocus);
    return () => document.removeEventListener("visibilitychange", onFocus);
  }, [load]);

  const notify = useCallback((msg, undo) => { setToast({ msg, undo, id: Date.now() }); }, []);

  const add = useCallback(async (row) => {
    const { data, error } = await supabase.from("transactions").insert(row).select().single();
    if (error) throw new Error("Couldn't save. Check your connection.");
    setTx((p) => [data, ...p].sort(byTimeDesc));
    return data;
  }, []);

  const update = useCallback(async (id, row) => {
    const { data, error } = await supabase.from("transactions").update(row).eq("id", id).select().single();
    if (error) throw new Error("Couldn't save changes.");
    setTx((p) => p.map((x) => (x.id === id ? data : x)).sort(byTimeDesc));
    return data;
  }, []);

  const remove = useCallback(async (id) => {
    const old = tx.find((x) => x.id === id);
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) throw new Error("Couldn't delete.");
    setTx((p) => p.filter((x) => x.id !== id));
    return old;
  }, [tx]);

  const saveLimit = useCallback(async (v) => {
    setLimit(v);
    const { error } = await supabase.from("settings").upsert({ user_id: user.id, weekly_limit: v, updated_at: new Date().toISOString() });
    if (error) throw new Error("Couldn't save your limit.");
  }, [user]);

  const value = useMemo(() => ({ user, tx, limit, loading, error, load, add, update, remove, saveLimit, sheet, setSheet, toast, setToast, notify }),
    [user, tx, limit, loading, error, load, add, update, remove, saveLimit, sheet, toast, notify]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
