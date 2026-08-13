-- Apply only after reconciling the production migration baseline.
-- Collector Passports are explicit opt-in summaries; private Vault records are
-- never copied into this table automatically.

alter table public.community_ratings add column if not exists tradition text;
alter table public.community_ratings add column if not exists release_context text;
alter table public.community_ratings add column if not exists flavor_score integer check (flavor_score between 1 and 100);
alter table public.community_ratings add column if not exists construction_score integer check (construction_score between 1 and 100);
alter table public.community_ratings add column if not exists draw_score integer check (draw_score between 1 and 100);
alter table public.community_ratings add column if not exists burn_score integer check (burn_score between 1 and 100);
alter table public.community_ratings add column if not exists consistency_score integer check (consistency_score between 1 and 100);
alter table public.community_ratings add column if not exists value_score integer check (value_score between 1 and 100);
alter table public.community_ratings add column if not exists buy_again boolean;

create table if not exists public.collector_passports (
  user_id uuid primary key references auth.users(id) on delete cascade,
  handle text not null unique,
  display_name text not null,
  bio text not null default '',
  years_collecting integer check (years_collecting between 0 and 100),
  interests text[] not null default '{}',
  favorite_origins text[] not null default '{}',
  favorite_makers text[] not null default '{}',
  favorite_vitolas text[] not null default '{}',
  featured_cigars text[] not null default '{}',
  visibility text not null default 'private' check (visibility in ('private','community')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.collector_passports enable row level security;
create policy "collector owns passport" on public.collector_passports for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "community passports are readable" on public.collector_passports for select using (visibility='community');
comment on table public.collector_passports is 'Explicitly curated collector identity; never a public inventory projection.';
