"use client";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { cva } from "class-variance-authority";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { appById, initials } from "@/lib/apps";

export const cn = (...a) => twMerge(clsx(a));

export const button = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-[4px] font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap",
  {
    variants: {
      variant: {
        primary: "bg-ink text-white hover:bg-sub",
        outline: "border border-line2 bg-white hover:bg-soft",
        danger: "border border-down/30 text-down bg-white hover:bg-downbg",
        ghost: "hover:bg-soft",
      },
      size: { sm: "h-8 px-3 text-[13px]", md: "h-10 px-4 text-sm", lg: "h-12 px-5 text-[15px]", icon: "h-8 w-8" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);
export const Button = ({ variant, size, className, ...p }) => <button className={cn(button({ variant, size }), className)} {...p} />;

export function Panel({ title, right, children, className, bodyClass, flush }) {
  return (
    <section className={cn("border border-line rounded-[4px] bg-white min-w-0", className)}>
      {(title || right) && (
        <header className="flex items-center justify-between gap-3 h-10 px-3 border-b border-line bg-soft">
          <h2 className="label">{title}</h2>
          <div className="flex items-center gap-2">{right}</div>
        </header>
      )}
      <div className={cn(!flush && "p-3", bodyClass)}>{children}</div>
    </section>
  );
}

export function Kpis({ items, cols = "md:grid-cols-5", className }) {
  return (
    <div className={cn("grid grid-cols-2 gap-px bg-line border border-line rounded-[4px] overflow-hidden", cols, className)}>
      {items.map((k) => (
        <div key={k.label} className="bg-white px-3 py-3 min-w-0">
          <div className="label mb-2">{k.label}</div>
          <div className={cn("num text-[19px] md:text-[21px] font-medium", k.tone)}>{k.value}</div>
          {k.sub && <div className="text-[12px] text-mute mt-1 truncate">{k.sub}</div>}
        </div>
      ))}
      {items.length % 2 === 1 && <div className="bg-white md:hidden" />}
    </div>
  );
}

export function Segmented({ value, onChange, options, className }) {
  return (
    <ToggleGroup.Root type="single" value={value} onValueChange={(v) => v && onChange(v)} className={cn("inline-flex border border-line2 rounded-[4px] overflow-hidden bg-white", className)}>
      {options.map(([v, l]) => (
        <ToggleGroup.Item key={v} value={v} className="h-7 px-2.5 text-[12px] font-medium text-sub border-r border-line2 last:border-r-0 data-[state=on]:bg-ink data-[state=on]:text-white">
          {l}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}

export function AppTag({ app, name, size = 20 }) {
  const a = appById(app);
  const mark = app === "Promo" && name ? initials(name) : a.mark;
  return (
    <span aria-hidden="true" className="inline-grid place-items-center rounded-[3px] font-bold shrink-0 tracking-tight"
      style={{ width: size, height: size, background: a.bg, color: a.fg, fontSize: Math.round(size * (mark.length > 2 ? 0.36 : 0.44)) }}>
      {mark}
    </span>
  );
}

export const toneOf = (n) => (n < -0.004 ? "text-down" : n > 0.004 ? "text-up" : "");
export const Skeleton = ({ className }) => <div className={cn("animate-pulse bg-soft border border-line rounded-[4px]", className)} />;
