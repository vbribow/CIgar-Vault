create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  partner_type text not null check (partner_type in ('retailer','lounge','manufacturer','creator','media','industry','other')),
  website_url text,
  contact_name text,
  contact_email text,
  disclosure_text text not null,
  notes text,
  status text not null default 'draft' check (status in ('draft','active','paused','ended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partner_campaigns (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  name text not null,
  code text not null unique,
  channel text not null check (channel in ('email','website','social','event','qr','creator','other')),
  destination_path text not null default '/partners/join',
  status text not null default 'draft' check (status in ('draft','active','paused','ended')),
  attribution_window_days integer not null default 30 check (attribution_window_days between 1 and 365),
  commission_type text not null default 'percentage' check (commission_type in ('percentage','fixed')),
  commission_rate numeric(12,4) not null default 20,
  hold_days integer not null default 30 check (hold_days between 0 and 180),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partner_clicks (
  id uuid primary key default gen_random_uuid(),
  click_token uuid not null default gen_random_uuid() unique,
  partner_id uuid not null references public.partners(id) on delete cascade,
  campaign_id uuid not null references public.partner_campaigns(id) on delete cascade,
  landing_path text not null,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz not null default now()
);

create table if not exists public.partner_attributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  click_id uuid not null references public.partner_clicks(id),
  partner_id uuid not null references public.partners(id),
  campaign_id uuid not null references public.partner_campaigns(id),
  attributed_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists public.partner_conversions (
  id uuid primary key default gen_random_uuid(),
  attribution_id uuid not null references public.partner_attributions(id),
  user_id uuid not null references auth.users(id) on delete cascade,
  partner_id uuid not null references public.partners(id),
  campaign_id uuid not null references public.partner_campaigns(id),
  conversion_kind text not null check (conversion_kind in ('account_created','activated','subscription_started','invoice_paid')),
  external_event_id text not null unique,
  gross_revenue_cents integer not null default 0,
  net_revenue_cents integer not null default 0,
  currency text not null default 'usd',
  status text not null default 'confirmed' check (status in ('pending','confirmed','refunded','void')),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.partner_payouts (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id),
  period_start date not null,
  period_end date not null,
  amount_cents integer not null default 0,
  currency text not null default 'usd',
  status text not null default 'draft' check (status in ('draft','approved','processing','paid','failed','void')),
  payment_reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partner_commissions (
  id uuid primary key default gen_random_uuid(),
  conversion_id uuid not null unique references public.partner_conversions(id),
  partner_id uuid not null references public.partners(id),
  campaign_id uuid not null references public.partner_campaigns(id),
  payout_id uuid references public.partner_payouts(id),
  amount_cents integer not null,
  currency text not null default 'usd',
  commission_type text not null check (commission_type in ('percentage','fixed')),
  commission_rate numeric(12,4) not null,
  status text not null default 'pending' check (status in ('pending','approved','void','paid')),
  available_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partner_audit_events (
  id bigint generated always as identity primary key,
  partner_id uuid references public.partners(id) on delete set null,
  campaign_id uuid references public.partner_campaigns(id) on delete set null,
  actor text not null default 'founder',
  action text not null,
  subject_type text not null,
  subject_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists partner_clicks_campaign_created_idx on public.partner_clicks(campaign_id,created_at desc);
create index if not exists partner_attributions_partner_idx on public.partner_attributions(partner_id,attributed_at desc);
create index if not exists partner_conversions_partner_idx on public.partner_conversions(partner_id,occurred_at desc);
create index if not exists partner_commissions_partner_status_idx on public.partner_commissions(partner_id,status,available_at);

alter table public.partners enable row level security;
alter table public.partner_campaigns enable row level security;
alter table public.partner_clicks enable row level security;
alter table public.partner_attributions enable row level security;
alter table public.partner_conversions enable row level security;
alter table public.partner_commissions enable row level security;
alter table public.partner_payouts enable row level security;
alter table public.partner_audit_events enable row level security;

-- Partner commercial records are deliberately service-role only. Partner dashboards
-- receive aggregated, privacy-safe results through authenticated server endpoints.
