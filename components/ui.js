"use client";
import { appById, initials } from "@/lib/apps";

export function Badge({ app, name, size = "" }) {
  const a = appById(app);
  const mark = app === "Promo" && name ? initials(name) : a.mark;
  return <span className={`badge ${size}`} style={{ background: a.bg, color: a.fg }} aria-hidden="true">{mark}</span>;
}

export function Seg({ value, onChange, options }) {
  return (
    <div className="seg" role="tablist">
      {options.map(([v, l]) => (
        <button key={v} role="tab" aria-selected={value === v} className={value === v ? "on" : ""} onClick={() => onChange(v)}>{l}</button>
      ))}
    </div>
  );
}

export function Stat({ label, value, cls = "" }) {
  return <div className="stat"><span className="eyebrow">{label}</span><b className={cls}>{value}</b></div>;
}

export const Skeleton = ({ h = 120 }) => <div className="skel" style={{ height: h }} />;
