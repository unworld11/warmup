-- Run once in the warmup Supabase project (urgxsewrznxyboyalpqy)
-- Dashboard -> SQL Editor -> Run. Additive only.

-- 1. deals table
create table if not exists public.warmup_deals (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  url        text,
  brand_name text,
  config     jsonb not null,
  status     text not null default 'draft',   -- 'draft' | 'published'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists warmup_deals_status_idx on public.warmup_deals (status);

-- 2. RLS. The app uses the publishable (anon) key, so the anon role needs
--    explicit policies. Permissive for a prototype; tighten once we add login.
alter table public.warmup_deals enable row level security;

drop policy if exists "warmup public read published" on public.warmup_deals;
create policy "warmup public read published" on public.warmup_deals
  for select using (status = 'published');

drop policy if exists "warmup anon insert" on public.warmup_deals;
create policy "warmup anon insert" on public.warmup_deals
  for insert with check (true);

drop policy if exists "warmup anon update" on public.warmup_deals;
create policy "warmup anon update" on public.warmup_deals
  for update using (true) with check (true);

-- 3. public bucket for generated imagery
insert into storage.buckets (id, name, public)
values ('warmup-content', 'warmup-content', true)
on conflict (id) do nothing;

drop policy if exists "warmup content read" on storage.objects;
create policy "warmup content read" on storage.objects
  for select using (bucket_id = 'warmup-content');

drop policy if exists "warmup content write" on storage.objects;
create policy "warmup content write" on storage.objects
  for insert with check (bucket_id = 'warmup-content');

drop policy if exists "warmup content update" on storage.objects;
create policy "warmup content update" on storage.objects
  for update using (bucket_id = 'warmup-content');
