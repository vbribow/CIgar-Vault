create table if not exists public.manufacturer_research_runs (
  run_id uuid primary key default gen_random_uuid(),
  brand_key text not null,
  brand text not null,
  response_id text unique,
  status text not null default 'starting' check (status in ('starting','queued','in_progress','completed','failed','cancelled')),
  report_payload jsonb,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  next_eligible_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists manufacturer_research_one_active_brand_idx
  on public.manufacturer_research_runs(brand_key)
  where status in ('starting','queued','in_progress');
create index if not exists manufacturer_research_runs_status_idx
  on public.manufacturer_research_runs(status,updated_at desc);
create index if not exists manufacturer_research_runs_brand_idx
  on public.manufacturer_research_runs(brand_key,started_at desc);

create table if not exists public.manufacturer_evidence_claims (
  claim_id uuid primary key default gen_random_uuid(),
  claim_hash text not null unique,
  run_id uuid not null references public.manufacturer_research_runs(run_id) on delete cascade,
  brand_key text not null,
  brand text not null,
  claim_type text not null check (claim_type in ('owner','authorship','manufacturing')),
  scope text not null default 'Brand',
  claim_value text not null,
  country text,
  production_period text,
  relationship text,
  source_title text not null,
  source_url text not null,
  source_type text not null check (source_type in ('Official','Verified Historical','Expert')),
  evidence_date date,
  confidence text not null check (confidence in ('High','Medium','Low')),
  evidence_status text not null check (evidence_status in ('Verified','Partially verified','Unresolved')),
  decision text not null default 'pending' check (decision in ('pending','auto_approved','approved','rejected','superseded')),
  review_note text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists manufacturer_evidence_brand_decision_idx
  on public.manufacturer_evidence_claims(brand_key,decision,claim_type,created_at desc);
create index if not exists manufacturer_evidence_review_idx
  on public.manufacturer_evidence_claims(decision,created_at desc);

alter table public.manufacturer_research_runs enable row level security;
alter table public.manufacturer_evidence_claims enable row level security;

-- Research execution, review, and publication use protected server routes with the
-- service role. No pending report or review history is directly exposed to clients.
