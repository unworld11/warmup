-- Run once in orca's Supabase (Dashboard -> SQL Editor -> Run).
-- Additive only: one table + one public storage bucket. Touches nothing else.

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

-- public bucket for the generated imagery (served by public URL)
insert into storage.buckets (id, name, public)
values ('warmup-content', 'warmup-content', true)
on conflict (id) do nothing;

-- All app access is server-side via the service key (which bypasses RLS),
-- so no row policies are needed. Bucket is public-read for the <img> tags.
