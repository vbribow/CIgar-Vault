create table if not exists public.industry_content_items (
  id text primary key,
  status text not null default 'published' check (status in ('published','rejected','archived')),
  source_url text not null,
  source_fingerprint text not null unique,
  payload jsonb not null,
  discovered_at timestamptz not null default now(),
  published_at timestamptz not null default now()
);
create index if not exists industry_content_status_date_idx on public.industry_content_items(status,published_at desc);
alter table public.industry_content_items enable row level security;
-- Only the protected service route writes; public rendering reads published payloads server-side.
