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

-- Profile photos: a public-read "avatars" bucket where each user can only
-- write inside their own folder (named after their user id).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Avatar public read" on storage.objects;
create policy "Avatar public read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "Avatar upload own" on storage.objects;
create policy "Avatar upload own" on storage.objects
  for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Avatar update own" on storage.objects;
create policy "Avatar update own" on storage.objects
  for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Avatar delete own" on storage.objects;
create policy "Avatar delete own" on storage.objects
  for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
