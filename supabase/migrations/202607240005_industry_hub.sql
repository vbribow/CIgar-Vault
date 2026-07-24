create table if not exists public.industry_profiles (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null unique references public.partners(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','submitted','approved','published','changes_requested','suspended')),
  trust_level text not null default 'Official' check (trust_level in ('Official','Verified Historical','Expert','Community','AI')),
  draft_payload jsonb not null default '{}'::jsonb,
  published_payload jsonb,
  submitted_at timestamptz,
  approved_at timestamptz,
  published_at timestamptz,
  reviewed_by text,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.industry_publications (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  publication_type text not null,
  status text not null default 'draft' check (status in ('draft','submitted','approved','published','changes_requested','archived')),
  trust_level text not null default 'Official' check (trust_level in ('Official','Verified Historical','Expert','Community','AI')),
  draft_payload jsonb not null default '{}'::jsonb,
  published_payload jsonb,
  submitted_at timestamptz,
  approved_at timestamptz,
  published_at timestamptz,
  reviewed_by text,
  review_note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.industry_revisions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  entity_type text not null check (entity_type in ('profile','publication')),
  entity_id uuid not null,
  action text not null,
  actor text not null,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists industry_publications_partner_status_idx on public.industry_publications(partner_id,status,published_at desc);
create index if not exists industry_revisions_entity_idx on public.industry_revisions(entity_type,entity_id,created_at desc);

alter table public.industry_profiles enable row level security;
alter table public.industry_publications enable row level security;
alter table public.industry_revisions enable row level security;

-- Service-side APIs enforce organization scope, founder publication authority,
-- and permanent revisions. This migration creates no organization content and
-- does not modify the founder-locked Fox record.
