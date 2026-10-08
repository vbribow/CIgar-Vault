alter table public.beta_collectors
  add column if not exists invitation_provider_id text,
  add column if not exists invitation_delivery_status text not null default 'not_submitted',
  add column if not exists invitation_submitted_at timestamptz,
  add column if not exists invitation_delivered_at timestamptz,
  add column if not exists invitation_last_checked_at timestamptz,
  add column if not exists invitation_failure text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'beta_collectors_invitation_delivery_status_check'
      and conrelid = 'public.beta_collectors'::regclass
  ) then
    alter table public.beta_collectors
      add constraint beta_collectors_invitation_delivery_status_check
      check (invitation_delivery_status in ('not_submitted','submitted','delivered','failed','unknown'));
  end if;
end $$;

create index if not exists beta_collectors_invitation_delivery_status_idx
  on public.beta_collectors(invitation_delivery_status, invitation_submitted_at desc);

comment on column public.beta_collectors.invitation_delivery_status is
  'Delivery evidence from the email provider. submitted never means delivered.';
