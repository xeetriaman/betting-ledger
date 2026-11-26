import { APPS, label } from "./apps";
import { addDays, dayKey, monthKey, parts, todayKey, weekKey, fmtDay } from "./format";

const isDep = (t) => t.type === "deposit";
// Summary rows from your own records have no real date, so keep them out of week/month views.
export const dated = (list) => list.filter((t) => t.source !== "records");
const amt = (t) => Number(t.amount) || 0;

export function totals(list) {
  let dep = 0, wd = 0, nDep = 0, nWd = 0;
  for (const t of list) { if (isDep(t)) { dep += amt(t); nDep++; } else { wd += amt(t); nWd++; } }
  return { dep, wd, net: wd - dep, nDep, nWd };
}

export function inRange(list, range) {
  if (range === "all") return list;
  const t = todayKey();
  const from = range === "week" ? weekKey(new Date()) : range === "month" ? t.slice(0, 8) + "01" : addDays(t, -(range === "90d" ? 89 : 29));
  return list.filter((x) => dayKey(x.occurred_at) >= from);
}

export const byApp = (list) => APPS.map((a) => ({ app: a, ...totals(list.filter((t) => t.app === a.id)) }));

export function promoSites(list) {
  const m = new Map();
  for (const t of list) if (t.app === "Promo") { const k = label(t); m.set(k, [...(m.get(k) || []), t]); }
  return [...m].map(([name, rows]) => ({ name, ...totals(rows) })).sort((a, b) => b.dep - a.dep);
}

// Running net, one point per active day, oldest first.
export function cumulative(list) {
  const days = new Map();
  for (const t of list) { const k = dayKey(t.occurred_at); days.set(k, (days.get(k) || 0) + (isDep(t) ? -amt(t) : amt(t))); }
  let run = 0;
  return [...days.keys()].sort().map((k) => { run += days.get(k); return { k, label: fmtDay(k), net: Math.round(run * 100) / 100, day: Math.round(days.get(k) * 100) / 100 }; });
}

export function monthly(list) {
  const m = new Map();
  for (const t of list) { const k = monthKey(t.occurred_at); const o = m.get(k) || { k, dep: 0, wd: 0 }; isDep(t) ? (o.dep += amt(t)) : (o.wd += amt(t)); m.set(k, o); }
  return [...m.values()].sort((a, b) => a.k.localeCompare(b.k)).map((o) => ({ ...o, dep: +o.dep.toFixed(2), wd: +o.wd.toFixed(2), net: +(o.wd - o.dep).toFixed(2) }));
}

export function weekly(list, n = 12) {
  const start = weekKey(new Date());
  const weeks = Array.from({ length: n }, (_, i) => addDays(start, -7 * (n - 1 - i)));
  const dep = new Map(weeks.map((w) => [w, 0]));
  for (const t of dated(list)) if (isDep(t)) { const w = weekKey(t.occurred_at); if (dep.has(w)) dep.set(w, dep.get(w) + amt(t)); }
  return weeks.map((w) => ({ k: w, label: fmtDay(w), dep: +dep.get(w).toFixed(2) }));
}

export function thisWeek(list) {
  const start = weekKey(new Date());
  const days = Array.from({ length: 7 }, (_, i) => ({ k: addDays(start, i), dep: 0 }));
  for (const t of dated(list)) if (isDep(t)) { const k = dayKey(t.occurred_at); const d = days.find((x) => x.k === k); if (d) d.dep += amt(t); }
  return { days, total: days.reduce((s, d) => s + d.dep, 0) };
}

// Deposits by weekday × 4-hour block (exact times only).
export const BLOCKS = ["12–4am", "4–8am", "8am–12", "12–4pm", "4–8pm", "8pm–12"];
export function heatmap(list) {
  const grid = Array.from({ length: 7 }, () => Array.from({ length: 6 }, () => ({ n: 0, sum: 0 })));
  for (const t of list) if (isDep(t) && !t.approx) { const p = parts(t.occurred_at); const c = grid[p.wd][Math.floor(p.h / 4)]; c.n++; c.sum += amt(t); }
  return grid;
}

export const SIZES = [["Under $10", 0, 10], ["$10–25", 10, 25], ["$25–50", 25, 50], ["$50–100", 50, 100], ["$100+", 100, Infinity]];
export const sizes = (list) => SIZES.map(([name, lo, hi]) => { const g = list.filter((t) => isDep(t) && !t.approx && amt(t) >= lo && amt(t) < hi); return { name, n: g.length, sum: g.reduce((s, t) => s + amt(t), 0) }; });

const DAYNAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
// Plain-language patterns from exact-time deposits.
export function patterns(list) {
  const deps = list.filter((t) => isDep(t) && !t.approx).sort((a, b) => new Date(a.occurred_at) - new Date(b.occurred_at));
  if (deps.length < 5) return [];
  const out = [];
  const late = deps.filter((t) => { const h = parts(t.occurred_at).h; return h >= 22 || h < 5; });
  out.push({ k: "late", title: `${Math.round((late.length / deps.length) * 100)}% of deposits are late-night`, body: `${late.length} of ${deps.length} deposits happened between 10pm and 5am.` });
  const byDay = Array(7).fill(0); deps.forEach((t) => (byDay[parts(t.occurred_at).wd] += amt(t)));
  const top = byDay.indexOf(Math.max(...byDay));
  out.push({ k: "day", title: `${DAYNAMES[top]} is your biggest day`, body: `You've deposited a total of $${byDay[top].toFixed(2)} on ${DAYNAMES[top]}s.` });
  let quick = 0;
  for (let i = 1; i < deps.length; i++) if (new Date(deps[i].occurred_at) - new Date(deps[i - 1].occurred_at) <= 30 * 60000) quick++;
  out.push({ k: "chase", title: `${Math.round((quick / deps.length) * 100)}% are top-ups within 30 minutes`, body: `${quick} deposits came less than 30 minutes after the previous one — usually a sign of chasing a loss.` });
  const perDay = new Map(); deps.forEach((t) => { const k = dayKey(t.occurred_at); perDay.set(k, (perDay.get(k) || 0) + amt(t)); });
  const [bk, bv] = [...perDay].sort((a, b) => b[1] - a[1])[0];
  out.push({ k: "max", title: `Biggest day: ${fmtDay(bk, { day: "numeric", month: "long" })}`, body: `$${bv.toFixed(2)} deposited in one day.` });
  const keys = [...perDay.keys()].sort(); let best = 1, run = 1;
  for (let i = 1; i < keys.length; i++) { run = addDays(keys[i - 1], 1) === keys[i] ? run + 1 : 1; best = Math.max(best, run); }
  out.push({ k: "streak", title: `Longest streak: ${best} days in a row`, body: `Days with at least one deposit, back to back.` });
  return out;
}

export function groupByDay(list) {
  const m = new Map();
  for (const t of list) { const k = dayKey(t.occurred_at); if (!m.has(k)) m.set(k, []); m.get(k).push(t); }
  return [...m].map(([k, rows]) => ({ k, rows, ...totals(rows) }));
}
