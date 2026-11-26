-- Ledger schema (history seed is kept out of the repo).
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  app text not null check (app in ('bet365','Sportsbet','Ladbrokes','Neds','Promo')),
  promo text check (promo is null or char_length(promo) <= 40),
  type text not null check (type in ('deposit','withdrawal')),
  amount numeric(10,2) not null check (amount > 0 and amount < 1000000),
  occurred_at timestamptz not null default now(),
  approx boolean not null default false,
  source text not null default 'app',
  note text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default now()
);
create index transactions_user_time_idx on public.transactions (user_id, occurred_at desc);
alter table public.transactions enable row level security;
create policy "own rows read" on public.transactions for select to authenticated using (user_id = (select auth.uid()));
create policy "own rows insert" on public.transactions for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own rows update" on public.transactions for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows delete" on public.transactions for delete to authenticated using (user_id = (select auth.uid()));

create table public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  weekly_limit numeric(10,2) not null default 40 check (weekly_limit >= 0),
  updated_at timestamptz not null default now()
);
alter table public.settings enable row level security;
create policy "own settings read" on public.settings for select to authenticated using (user_id = (select auth.uid()));
create policy "own settings write" on public.settings for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own settings insert" on public.settings for insert to authenticated with check (user_id = (select auth.uid()));

create table public.passkeys (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  public_key text not null,
  counter bigint not null default 0,
  transports text[],
  device text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
create index passkeys_user_idx on public.passkeys (user_id);
alter table public.passkeys enable row level security;
create policy "own passkeys read" on public.passkeys for select to authenticated using (user_id = (select auth.uid()));
create policy "own passkeys delete" on public.passkeys for delete to authenticated using (user_id = (select auth.uid()));

create table public.webauthn_challenges (
  id uuid primary key default gen_random_uuid(),
  challenge text not null,
  user_id uuid references auth.users(id) on delete cascade,
  kind text not null check (kind in ('register','login')),
  created_at timestamptz not null default now()
);
alter table public.webauthn_challenges enable row level security;

-- Single-owner ledger: the first account is auto-confirmed and claims the history; later sign-ups are refused.
create or replace function public.ledger_before_signup() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from auth.users) then raise exception 'Sign-ups are closed for this ledger'; end if;
  new.email_confirmed_at := coalesce(new.email_confirmed_at, now());
  return new;
end $$;
create or replace function public.ledger_after_signup() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.transactions set user_id = new.id where user_id is null;
  insert into public.settings (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;
revoke execute on function public.ledger_before_signup() from public, anon, authenticated;
revoke execute on function public.ledger_after_signup() from public, anon, authenticated;
create trigger ledger_before_signup before insert on auth.users for each row execute function public.ledger_before_signup();
create trigger ledger_after_signup after insert on auth.users for each row execute function public.ledger_after_signup();
