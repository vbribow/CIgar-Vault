create table if not exists public.partner_readiness_items (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  item_key text not null,
  category text not null,
  title text not null,
  description text not null,
  required boolean not null default true,
  status text not null default 'pending' check (status in ('pending','submitted','approved','changes_requested','waived')),
  partner_note text,
  evidence_url text,
  founder_note text,
  submitted_by uuid references auth.users(id) on delete set null,
  submitted_at timestamptz,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(partner_id,item_key)
);

create index if not exists partner_readiness_partner_status_idx
on public.partner_readiness_items(partner_id,status);

alter table public.partner_readiness_items enable row level security;

-- No readiness records are created by this migration. In particular, the
-- founder-locked Fox record remains untouched. Initialization is an explicit,
-- audited founder action and is rejected for collaboration-locked partners.
