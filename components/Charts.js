"use client";
import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money, signed, fmtMonth } from "@/lib/format";
import { BLOCKS } from "@/lib/stats";
import { cn } from "./ui";

const UP = "#00873c", DOWN = "#d92d20", GRID = "#f0f0f2", TICK = { fill: "#82828c", fontSize: 11, fontFamily: "var(--font-plex-mono)" };
const yfmt = (v) => (Math.abs(v) >= 1000 ? `${v < 0 ? "−" : ""}$${(Math.abs(v) / 1000).toFixed(1)}k` : `${v < 0 ? "−" : ""}$${Math.abs(v)}`);

function Tip({ active, payload, render }) {
  if (!active || !payload?.length) return null;
  return <div className="bg-white border border-line2 rounded-[4px] px-2.5 py-2 text-[12px] shadow-sm">{render(payload[0].payload)}</div>;
}

export function NetArea({ data, height = 220 }) {
  if (data.length < 2) return <p className="text-mute py-8 text-center">Not enough history yet.</p>;
  const vals = data.map((d) => d.net);
  const min = Math.min(0, ...vals), max = Math.max(0, ...vals);
  const zero = max === min ? 0.5 : max / (max - min);
  const id = `n${data.length}${Math.round(Math.abs(vals[vals.length - 1]))}`;
  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id + "s"} x1="0" y1="0" x2="0" y2="1"><stop offset={0} stopColor={UP} /><stop offset={zero} stopColor={UP} /><stop offset={zero} stopColor={DOWN} /><stop offset={1} stopColor={DOWN} /></linearGradient>
            <linearGradient id={id + "f"} x1="0" y1="0" x2="0" y2="1"><stop offset={0} stopColor={UP} stopOpacity={0.12} /><stop offset={zero} stopColor={UP} stopOpacity={0.02} /><stop offset={zero} stopColor={DOWN} stopOpacity={0.02} /><stop offset={1} stopColor={DOWN} stopOpacity={0.12} /></linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={TICK} tickLine={false} axisLine={{ stroke: "#e4e4e7" }} minTickGap={36} />
          <YAxis orientation="right" tick={TICK} tickLine={false} axisLine={false} width={52} tickFormatter={yfmt} />
          <ReferenceLine y={0} stroke="#a1a1aa" strokeDasharray="2 3" />
          <Tooltip cursor={{ stroke: "#a1a1aa", strokeDasharray: "2 3" }} content={<Tip render={(p) => <><div className="text-mute">{p.label}</div><div>Running <b className={cn("num", p.net < 0 ? "text-down" : "text-up")}>{signed(p.net)}</b></div><div className="text-mute">Day <span className="num">{signed(p.day)}</span></div></>} />} />
          <Area type="linear" dataKey="net" stroke={`url(#${id}s)`} strokeWidth={1.6} fill={`url(#${id}f)`} baseValue={0} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthBars({ data }) {
  if (!data.length) return <p className="text-mute py-6">No data yet.</p>;
  const rows = data.map((d) => ({ ...d, label: fmtMonth(d.k) }));
  return (
    <div style={{ height: 220 }}>
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 8, right: 0, left: 0, bottom: 0 }} barGap={2}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={TICK} tickLine={false} axisLine={{ stroke: "#e4e4e7" }} />
          <YAxis orientation="right" tick={TICK} tickLine={false} axisLine={false} width={52} tickFormatter={yfmt} />
          <Tooltip cursor={{ fill: "rgba(0,0,0,.03)" }} content={<Tip render={(p) => <><div className="text-mute">{fmtMonth(p.k, true)}</div><div>In <b className="num">{money(p.dep)}</b></div><div>Out <b className="num">{money(p.wd)}</b></div><div>Net <b className={cn("num", p.net < 0 ? "text-down" : "text-up")}>{signed(p.net)}</b></div></>} />} />
          <Bar dataKey="dep" fill={DOWN} maxBarSize={22} isAnimationActive={false} />
          <Bar dataKey="wd" fill={UP} maxBarSize={22} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeekBars({ data, limit }) {
  return (
    <div style={{ height: 240 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={TICK} tickLine={false} axisLine={{ stroke: "#e4e4e7" }} interval="preserveStartEnd" minTickGap={14} />
          <YAxis orientation="right" tick={TICK} tickLine={false} axisLine={false} width={52} tickFormatter={yfmt} />
          <ReferenceLine y={limit} stroke="#0a0a0a" strokeDasharray="4 3" ifOverflow="extendDomain" />
          <Tooltip cursor={{ fill: "rgba(0,0,0,.03)" }} content={<Tip render={(p) => <><div className="text-mute">Week of {p.label}</div><b className="num">{money(p.dep)}</b> deposited{p.dep > limit && <div className="text-down">{money(p.dep - limit)} over limit</div>}</>} />} />
          <Bar dataKey="dep" maxBarSize={30} isAnimationActive={false}>{data.map((d) => <Cell key={d.k} fill={d.dep > limit ? DOWN : "#a1a1aa"} />)}</Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAYL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export function Heatmap({ grid }) {
  const [sel, setSel] = useState(null);
  const max = Math.max(1, ...grid.flat().map((c) => c.sum));
  if (!grid.flat().some((c) => c.n)) return <p className="text-mute py-6">No timed deposits yet.</p>;
  const cur = sel && grid[sel[0]][sel[1]];
  return (
    <div>
      <div className="grid gap-[3px] text-[10.5px] text-mute" style={{ gridTemplateColumns: "32px repeat(6, minmax(0,1fr))" }}>
        <span />
        {BLOCKS.map((b) => <span key={b} className="text-center pb-1 num text-[10px]">{b}</span>)}
        {grid.map((row, d) => [
          <span key={"d" + d} className="flex items-center">{DAYS[d]}</span>,
          ...row.map((c, b) => (
            <button key={`${d}-${b}`} onMouseEnter={() => setSel([d, b])} onClick={() => setSel([d, b])}
              aria-label={`${DAYL[d]} ${BLOCKS[b]}: ${c.n} deposits, ${money(c.sum)}`}
              className={cn("h-7 rounded-[2px] num text-[10.5px] text-transparent hover:text-ink", sel?.[0] === d && sel?.[1] === b && "outline outline-[1.5px] outline-ink text-ink")}
              style={{ background: c.n ? `rgba(217,45,32,${0.08 + (c.sum / max) * 0.82})` : "#f4f4f5" }}>{c.n || ""}</button>
          )),
        ])}
      </div>
      <p className="text-[12.5px] text-sub mt-3 min-h-5">{cur ? <>{DAYL[sel[0]]} {BLOCKS[sel[1]]} — <b className="num">{cur.n}</b> deposits, <b className="num">{money(cur.sum)}</b></> : "Shade = money deposited. Hover or tap a cell."}</p>
    </div>
  );
}

export function Bars({ rows, color }) {
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.v)));
  return (
    <div className="divide-y divide-line">
      {rows.map((r) => (
        <div key={r.k} className="grid items-center gap-3 py-2 text-[13px]" style={{ gridTemplateColumns: "96px minmax(0,1fr) 96px" }}>
          <span className="truncate">{r.k}</span>
          <span className="h-2 bg-soft border border-line rounded-[2px] overflow-hidden"><i className="block h-full" style={{ width: `${(Math.abs(r.v) / max) * 100}%`, background: color || (r.v < 0 ? DOWN : UP) }} /></span>
          <span className={cn("num text-right", !color && (r.v < 0 ? "text-down" : "text-up"))}>{r.lab ?? signed(r.v)}</span>
        </div>
      ))}
    </div>
  );
}
