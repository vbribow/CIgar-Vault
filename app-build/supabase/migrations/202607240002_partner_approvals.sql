alter table public.partners add column if not exists campaigns_locked boolean not null default false;
alter table public.partners add column if not exists campaign_lock_reason text;

update public.partners
set campaigns_locked=true,
    campaign_lock_reason='Founder directive: no Fox campaign, test, trial, tracking, or launch without specific approval.',
    updated_at=now()
where slug='fox-cigars';

alter table public.partner_campaigns drop constraint if exists partner_campaigns_status_check;
alter table public.partner_campaigns add constraint partner_campaigns_status_check check (status in ('draft','review','approved','active','paused','ended'));
alter table public.partner_campaigns add column if not exists terms_confirmed boolean not null default false;
alter table public.partner_campaigns add column if not exists disclosure_approved boolean not null default false;
alter table public.partner_campaigns add column if not exists audience_consent_confirmed boolean not null default false;
alter table public.partner_campaigns add column if not exists privacy_reviewed boolean not null default false;
alter table public.partner_campaigns add column if not exists approved_at timestamptz;
alter table public.partner_campaigns add column if not exists approved_by text;
alter table public.partner_campaigns add column if not exists approval_note text;
alter table public.partner_campaigns add column if not exists approval_fingerprint text;
alter table public.partner_campaigns add column if not exists activated_at timestamptz;

create table if not exists public.partner_campaign_approvals (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  campaign_id uuid not null references public.partner_campaigns(id) on delete cascade,
  decision text not null check (decision in ('approved','rejected','invalidated','launched','paused')),
  actor text not null default 'founder',
  note text,
  configuration_fingerprint text,
  created_at timestamptz not null default now()
);

create table if not exists public.partner_memberships (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  invited_email text,
  role text not null check (role in ('owner','administrator','editor','analyst','viewer')),
  status text not null default 'invited' check (status in ('invited','active','revoked')),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_id is not null or invited_email is not null)
);

create unique index if not exists partner_memberships_partner_user_idx on public.partner_memberships(partner_id,user_id) where user_id is not null;
create unique index if not exists partner_memberships_partner_email_idx on public.partner_memberships(partner_id,lower(invited_email)) where invited_email is not null and status<>'revoked';
create index if not exists partner_campaign_approvals_campaign_idx on public.partner_campaign_approvals(campaign_id,created_at desc);

alter table public.partner_campaign_approvals enable row level security;
alter table public.partner_memberships enable row level security;

-- Partner roles cannot approve, launch, or emergency-pause campaigns.
-- Those actions remain service-side founder operations with permanent approval records.
