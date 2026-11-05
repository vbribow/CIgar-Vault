alter table public.profiles
  add column if not exists stripe_event_created_at bigint not null default 0;

create table if not exists public.billing_webhook_events (
  event_id text primary key,
  event_type text not null,
  event_created_at bigint not null default 0,
  status text not null default 'pending' check (status in ('pending', 'processed', 'failed')),
  processed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.billing_webhook_events enable row level security;
revoke all on table public.billing_webhook_events from anon, authenticated;

create index if not exists billing_webhook_events_status_idx
  on public.billing_webhook_events(status, event_created_at);
