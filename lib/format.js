export const TZ = "Australia/Sydney";

const money2 = new Intl.NumberFormat("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money0 = new Intl.NumberFormat("en-AU", { maximumFractionDigits: 0 });

export const money = (n, dp = 2) => "$" + (dp ? money2 : money0).format(Math.abs(n || 0));
export const signed = (n, dp = 2) => (n < -0.004 ? "−" : n > 0.004 ? "+" : "") + money(n, dp);
export const tone = (n) => (n < -0.004 ? "neg" : n > 0.004 ? "pos" : "");

const partsFmt = new Intl.DateTimeFormat("en-AU", {
  timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, weekday: "short",
});
const WD = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

// Wall-clock parts of a moment in Sydney.
export function parts(input) {
  const o = {};
  for (const p of partsFmt.formatToParts(new Date(input))) o[p.type] = p.value;
  return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour % 24, min: +o.minute, wd: WD[o.weekday] ?? 0 };
}

const pad = (n) => String(n).padStart(2, "0");
export const dayKey = (input) => { const p = parts(input); return `${p.y}-${pad(p.m)}-${pad(p.d)}`; };
export const monthKey = (input) => { const p = parts(input); return `${p.y}-${pad(p.m)}`; };

// Calendar maths on YYYY-MM-DD keys (UTC noon avoids DST edges).
const keyToDate = (k) => new Date(k + "T12:00:00Z");
const dateToKey = (d) => d.toISOString().slice(0, 10);
export const addDays = (k, n) => { const d = keyToDate(k); d.setUTCDate(d.getUTCDate() + n); return dateToKey(d); };
export const weekKey = (input) => { const k = dayKey(input); return addDays(k, -parts(input).wd); };
export const todayKey = () => dayKey(new Date());

export const fmtDay = (k, opts = { day: "numeric", month: "short" }) => keyToDate(k).toLocaleDateString("en-AU", { ...opts, timeZone: "UTC" });
export const fmtMonth = (mk, long = false) => keyToDate(mk + "-01").toLocaleDateString("en-AU", { month: long ? "long" : "short", year: long ? "numeric" : "2-digit", timeZone: "UTC" });
export const fmtTime = (input) => new Date(input).toLocaleTimeString("en-AU", { timeZone: TZ, hour: "numeric", minute: "2-digit" });

export function dayLabel(k) {
  const t = todayKey();
  if (k === t) return "Today";
  if (k === addDays(t, -1)) return "Yesterday";
  return fmtDay(k, { weekday: "short", day: "numeric", month: "short" });
}

// Value for <input type="datetime-local"> in Sydney time, and back.
export function toLocalInput(input) {
  const p = parts(input);
  return `${p.y}-${pad(p.m)}-${pad(p.d)}T${pad(p.h)}:${pad(p.min)}`;
}
export const fromLocalInput = (v) => new Date(v).toISOString();
