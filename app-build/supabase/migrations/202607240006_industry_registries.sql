create table if not exists public.industry_registry_records (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  record_type text not null check (record_type in ('product','release','packaging')),
  status text not null default 'draft' check (status in ('draft','submitted','approved','published','changes_requested','archived')),
  trust_level text not null default 'Official' check (trust_level = 'Official'),
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

create table if not exists public.industry_registry_revisions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  record_id uuid not null references public.industry_registry_records(id) on delete cascade,
  record_type text not null check (record_type in ('product','release','packaging')),
  action text not null,
  actor text not null,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists industry_registry_partner_status_idx on public.industry_registry_records(partner_id,record_type,status,published_at desc);
create index if not exists industry_registry_revisions_record_idx on public.industry_registry_revisions(record_id,created_at desc);

alter table public.industry_registry_records enable row level security;
alter table public.industry_registry_revisions enable row level security;

-- Organization-scoped service APIs enforce draft ownership. Founder review and publication are separate actions, and every transition is permanently logged.
