-- Nourish calorie tracker — Supabase schema
-- Run this once in the Supabase SQL editor (Dashboard → SQL → New query).
-- It creates one JSONB row per user for their diary state, locked down so a
-- user can only ever read or write their own row (Row-Level Security).

create table if not exists public.user_state (
  id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_state enable row level security;

drop policy if exists "Users read own state" on public.user_state;
create policy "Users read own state" on public.user_state
  for select using (auth.uid() = id);

drop policy if exists "Users insert own state" on public.user_state;
create policy "Users insert own state" on public.user_state
  for insert with check (auth.uid() = id);

drop policy if exists "Users update own state" on public.user_state;
create policy "Users update own state" on public.user_state
  for update using (auth.uid() = id) with check (auth.uid() = id);
