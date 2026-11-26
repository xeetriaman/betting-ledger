# Ledger

Personal betting money ledger: deposits and withdrawals across bet365, Sportsbet, Ladbrokes, Neds and promo apps, with per-app charts and patterns.

- **App:** Next.js (App Router) on Vercel — https://aman-ledger.vercel.app
- **Data:** Supabase (Postgres + row-level security). Single-owner: the first account created owns the ledger; further sign-ups are blocked.
- **Face ID:** passkeys via the `passkey` Supabase Edge Function (`supabase/functions/passkey`).

Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_KEY` (publishable key).
