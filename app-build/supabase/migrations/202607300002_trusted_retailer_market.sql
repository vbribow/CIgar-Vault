create table if not exists public.retailer_purchase_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  inventory_id text not null,
  retailer_key text not null,
  retailer_name text not null,
  listing_url text not null,
  listing_fingerprint text not null,
  status text not null default 'clicked' check (status in ('clicked','evidence_pending','verified','rejected','expired')),
  order_reference_hash text,
  receipt_evidence_url text,
  purchase_date date,
  receipt_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists retailer_purchase_sessions_user_idx on public.retailer_purchase_sessions(user_id, created_at desc);
create unique index if not exists retailer_purchase_sessions_order_idx
  on public.retailer_purchase_sessions(retailer_key, order_reference_hash)
  where order_reference_hash is not null;

create table if not exists public.retailer_reviews (
  id uuid primary key,
  purchase_session_id uuid not null unique references public.retailer_purchase_sessions(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  retailer_key text not null,
  overall smallint not null check (overall between 1 and 5),
  fulfillment smallint not null check (fulfillment between 1 and 5),
  packaging smallint not null check (packaging between 1 and 5),
  authenticity_confidence text not null check (authenticity_confidence in ('High','Medium','Concern')),
  review text,
  status text not null default 'verified' check (status in ('verified','review','hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists retailer_reviews_public_idx on public.retailer_reviews(retailer_key, status, created_at desc);

alter table public.retailer_purchase_sessions enable row level security;
alter table public.retailer_reviews enable row level security;

drop policy if exists "Users read own retailer purchase sessions" on public.retailer_purchase_sessions;
create policy "Users read own retailer purchase sessions" on public.retailer_purchase_sessions
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users read own retailer reviews" on public.retailer_reviews;
create policy "Users read own retailer reviews" on public.retailer_reviews
  for select to authenticated using ((select auth.uid()) = user_id);

-- All writes use trusted server routes. Public summaries are generated from
-- verified rows only and never expose order references, receipts, or user IDs.
