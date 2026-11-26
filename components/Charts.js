"use client";
import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money, signed, fmtMonth } from "@/lib/format";
import { BLOCKS } from "@/lib/stats";

const axis = { stroke: "transparent", tick: { fill: "#7f8a86", fontSize: 11 }, tickLine: false };

function Tip({ active, payload, render }) {
  if (!active || !payload?.length) return null;
  return <div className="tip">{render(payload[0].payload)}</div>;
}

export function NetArea({ data, height = 190 }) {
  if (data.length < 2) return <p className="mute" style={{ padding: "30px 0" }}>Not enough history yet.</p>;
  const last = data[data.length - 1].net;
  const min = Math.min(0, ...data.map((d) => d.net)), max = Math.max(0, ...data.map((d) => d.net));
  const zero = max === min ? 0.5 : max / (max - min);
  const id = "g" + Math.round(Math.abs(last * 100)) + data.length;
  return (
    <div className="chartbox" style={{ height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id={id + "s"} x1="0" y1="0" x2="0" y2="1">
              <stop offset={0} stopColor="#3ddc97" /><stop offset={zero} stopColor="#3ddc97" />
              <stop offset={zero} stopColor="#ff5c4a" /><stop offset={1} stopColor="#ff5c4a" />
            </linearGradient>
            <linearGradient id={id + "f"} x1="0" y1="0" x2="0" y2="1">
              <stop offset={0} stopColor="#3ddc97" stopOpacity={0.22} /><stop offset={zero} stopColor="#3ddc97" stopOpacity={0.02} />
              <stop offset={zero} stopColor="#ff5c4a" stopOpacity={0.02} /><stop offset={1} stopColor="#ff5c4a" stopOpacity={0.22} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" {...axis} minTickGap={40} />
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <ReferenceLine y={0} stroke="rgba(255,255,255,.18)" strokeDasharray="3 4" />
          <Tooltip cursor={{ stroke: "rgba(255,255,255,.2)" }} content={<Tip render={(p) => <><div className="mute">{p.label}</div><b className={p.net < 0 ? "neg" : "pos"}>{signed(p.net)}</b> running net<div className="mute">{signed(p.day)} that day</div></>} />} />
          <Area type="monotone" dataKey="net" stroke={`url(#${id}s)`} strokeWidth={2.2} fill={`url(#${id}f)`} baseValue={0} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthBars({ data }) {
  if (!data.length) return <p className="mute">No data yet.</p>;
  const rows = data.map((d) => ({ ...d, label: fmtMonth(d.k) }));
  return (
    <div className="chartbox tall">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 8, bottom: 0 }} barGap={3}>
          <XAxis dataKey="label" {...axis} />
          <YAxis hide />
          <Tooltip cursor={{ fill: "rgba(255,255,255,.04)" }} content={<Tip render={(p) => <><div className="mute">{fmtMonth(p.k, true)}</div><div>In <b>{money(p.dep)}</b></div><div>Out <b>{money(p.wd)}</b></div><div>Net <b className={p.net < 0 ? "neg" : "pos"}>{signed(p.net)}</b></div></>} />} />
          <Bar dataKey="dep" name="Deposited" fill="#ff5c4a" radius={[6, 6, 2, 2]} maxBarSize={26} />
          <Bar dataKey="wd" name="Withdrawn" fill="#3ddc97" radius={[6, 6, 2, 2]} maxBarSize={26} />
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", fontSize: 12, color: "#9aa4a0", marginTop: -6 }}>
        <span><i style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#ff5c4a", marginRight: 6 }} />Deposited</span>
        <span><i style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#3ddc97", marginRight: 6 }} />Withdrawn</span>
      </div>
    </div>
  );
}

export function WeekBars({ data, limit }) {
  return (
    <div className="chartbox tall">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 16, right: 8, left: 8, bottom: 0 }}>
          <XAxis dataKey="label" {...axis} interval="preserveStartEnd" minTickGap={18} />
          <YAxis hide domain={[0, (max) => Math.max(max, limit * 1.3)]} />
          <ReferenceLine y={limit} stroke="#c6f432" strokeDasharray="4 4" label={{ value: `Limit ${money(limit, 0)}`, fill: "#c6f432", fontSize: 11, position: "insideTopLeft" }} />
          <Tooltip cursor={{ fill: "rgba(255,255,255,.04)" }} content={<Tip render={(p) => <><div className="mute">Week of {p.label}</div><b>{money(p.dep)}</b> deposited{p.dep > limit && <div className="neg">{money(p.dep - limit)} over limit</div>}</>} />} />
          <Bar dataKey="dep" radius={[6, 6, 2, 2]} maxBarSize={28}>
            {data.map((d) => <Cell key={d.k} fill={d.dep > limit ? "#ff5c4a" : "#c4cbc8"} />)}
          </Bar>
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
  const total = grid.flat().reduce((s, c) => s + c.n, 0);
  if (!total) return <p className="mute">No exact-time deposits yet.</p>;
  const cur = sel && grid[sel[0]][sel[1]];
  return (
    <div>
      <div className="heat">
        <span />
        {BLOCKS.map((b) => <span className="hdr" key={b}>{b}</span>)}
        {grid.map((row, d) => [
          <span className="day" key={"d" + d}>{DAYS[d]}</span>,
          ...row.map((c, b) => {
            const a = c.sum / max;
            return (
              <button key={d + "-" + b} className={`c ${sel && sel[0] === d && sel[1] === b ? "on" : ""}`} aria-label={`${DAYL[d]} ${BLOCKS[b]}: ${c.n} deposits, ${money(c.sum)}`}
                onClick={() => setSel([d, b])} onMouseEnter={() => setSel([d, b])}
                style={{ background: c.n ? `rgba(255, 92, 74, ${0.12 + a * 0.85})` : undefined }}>{c.n || ""}</button>
            );
          }),
        ])}
      </div>
      <p className="hint">{cur ? <>{DAYL[sel[0]]}, {BLOCKS[sel[1]]}: <b className="num">{cur.n}</b> deposits · <b className="num">{money(cur.sum)}</b></> : "Darker = more money deposited. Tap a square for details."}</p>
    </div>
  );
}

export function HBars({ rows, color }) {
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.v)));
  return rows.map((r) => (
    <div className="hbar" key={r.k}>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.k}</span>
      <span className="tr"><i style={{ width: `${(Math.abs(r.v) / max) * 100}%`, background: color || (r.v < 0 ? "var(--neg)" : "var(--pos)") }} /></span>
      <span className={`num right ${color ? "" : r.v < 0 ? "neg" : "pos"}`}>{r.lab ?? signed(r.v)}</span>
    </div>
  ));
}
