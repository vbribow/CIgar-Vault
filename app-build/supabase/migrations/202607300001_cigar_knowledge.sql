create table if not exists public.cigar_knowledge_profiles (
  profile_id text primary key,
  identity_key text not null unique,
  brand text not null,
  line text not null,
  vitola text not null,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_payload jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cigar_knowledge_proposals (
  proposal_id uuid primary key default gen_random_uuid(),
  profile_id text not null references public.cigar_knowledge_profiles(profile_id) on delete cascade,
  source_workflow text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','superseded')),
  candidate_payload jsonb not null default '{}'::jsonb,
  reviewed_by text,
  review_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.cigar_knowledge_facts (
  fact_id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.cigar_knowledge_proposals(proposal_id) on delete cascade,
  profile_id text not null references public.cigar_knowledge_profiles(profile_id) on delete cascade,
  field_name text not null,
  proposed_value jsonb not null,
  source_url text not null,
  source_title text not null,
  source_type text not null check (source_type in ('Official','Verified Historical','Expert','Community','AI-assisted')),
  confidence text not null check (confidence in ('High','Medium','Low')),
  evidence_date date,
  status text not null default 'pending' check (status in ('pending','approved','rejected','superseded')),
  reviewed_by text,
  review_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.cigar_knowledge_revisions (
  revision_id uuid primary key default gen_random_uuid(),
  profile_id text not null references public.cigar_knowledge_profiles(profile_id) on delete cascade,
  proposal_id uuid references public.cigar_knowledge_proposals(proposal_id) on delete set null,
  action text not null,
  actor text not null,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists cigar_knowledge_proposals_profile_status_idx on public.cigar_knowledge_proposals(profile_id,status,created_at desc);
create index if not exists cigar_knowledge_facts_profile_field_status_idx on public.cigar_knowledge_facts(profile_id,field_name,status,created_at desc);
create index if not exists cigar_knowledge_revisions_profile_idx on public.cigar_knowledge_revisions(profile_id,created_at desc);

alter table public.cigar_knowledge_profiles enable row level security;
alter table public.cigar_knowledge_proposals enable row level security;
alter table public.cigar_knowledge_facts enable row level security;
alter table public.cigar_knowledge_revisions enable row level security;

-- Shared knowledge writes and review use founder-authorized server routes with the service role.
-- Collector RLS receives no direct access to pending evidence or private review history.
