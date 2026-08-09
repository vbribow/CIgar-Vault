-- Provision only after the production migration baseline is reconciled and
-- immediately before founder-approved API billing activation.
-- These ledgers are server-only: no browser policy is intentionally created.

create table if not exists public.cigar_research_cache (
  query_hash text primary key,
  normalized_query text not null,
  canonical_identity text not null default '',
  result jsonb not null,
  source_urls text[] not null default '{}',
  identity_expires_at timestamptz not null,
  availability_expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cigar_research_cache_identity_idx
  on public.cigar_research_cache(canonical_identity);
create index if not exists cigar_research_cache_availability_idx
  on public.cigar_research_cache(availability_expires_at);
alter table public.cigar_research_cache enable row level security;

create table if not exists public.cigar_research_requests (
  request_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  query_hash text not null,
  normalized_query text not null,
  model text,
  status text not null check (status in ('running','completed','failed','cached')),
  cache_hit boolean not null default false,
  billable boolean not null default false,
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  web_search_calls integer not null default 0 check (web_search_calls >= 0),
  error_code text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists cigar_research_requests_user_guard_idx
  on public.cigar_research_requests(user_id,billable,created_at desc);
create index if not exists cigar_research_requests_query_idx
  on public.cigar_research_requests(query_hash,created_at desc);
alter table public.cigar_research_requests enable row level security;

comment on table public.cigar_research_cache is
  'Server-only, source-backed cigar research cache; not an inventory authority.';
comment on table public.cigar_research_requests is
  'Server-only idempotency, quota, and usage ledger for paid cigar research.';
