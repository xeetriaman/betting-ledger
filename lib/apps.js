// The four main bookmakers plus one bucket for promo/sign-up-bonus apps.
// Brand colours only — no official logos (trademarked artwork).
export const APPS = [
  { id: "bet365", name: "bet365", slug: "bet365", bg: "#027B5B", fg: "#FFE01B", mark: "365" },
  { id: "Sportsbet", name: "Sportsbet", slug: "sportsbet", bg: "#0B5CAD", fg: "#FFD200", mark: "SB" },
  { id: "Ladbrokes", name: "Ladbrokes", slug: "ladbrokes", bg: "#D7141A", fg: "#FFFFFF", mark: "L" },
  { id: "Neds", name: "Neds", slug: "neds", bg: "#FF7A1A", fg: "#141414", mark: "N" },
  { id: "Promo", name: "Promo apps", slug: "promo", bg: "#23292D", fg: "#C6F432", mark: "P" },
];

export const appById = (id) => APPS.find((a) => a.id === id) || APPS[4];
export const appBySlug = (slug) => APPS.find((a) => a.slug === slug);

export const label = (t) => (t.app === "Promo" ? t.promo || "Promo app" : t.app);

export const initials = (name = "") =>
  name
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "P";
