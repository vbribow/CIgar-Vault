-- Prepared subscription tiers and a server-only, atomic AI credit ledger.
-- This migration is intentionally safe for existing Free, Founder, and legacy Pro profiles.
alter table public.profiles add column if not exists billing_interval text;
alter table public.profiles add column if not exists reserve_trial_redeemed_at timestamptz;

-- Enforce creation limits at the database boundary so simultaneous requests cannot
-- exceed a membership allowance. Updates and existing records are never deleted.
create or replace function public.enforce_vault_membership_capacity() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_plan text;
  v_status text;
  v_limit integer;
  v_count integer;
begin
  if new.kind not in ('inventory','humidors','sensors') then return new; end if;
  select billing_plan, billing_status into v_plan, v_status from public.profiles where user_id = new.user_id for update;
  v_plan := coalesce(v_plan, 'free');
  if v_plan = 'pro' then v_plan := 'reserve'; end if;
  if v_plan <> 'free' and coalesce(v_status, '') not in ('active','trialing') then v_plan := 'free'; end if;
  v_limit := case
    when new.kind = 'inventory' and v_plan = 'free' then 25
    when new.kind = 'humidors' and v_plan = 'free' then 1
    when new.kind = 'humidors' and v_plan = 'collector' then 3
    when new.kind = 'sensors' and v_plan = 'free' then 0
    when new.kind = 'sensors' and v_plan = 'collector' then 1
    else null
  end;
  if v_limit is null then return new; end if;
  select count(*) into v_count from public.vault_records where user_id = new.user_id and kind = new.kind;
  if v_count >= v_limit then
    raise exception 'Your % membership includes % %. Existing records remain protected; review membership options to add another.',
      initcap(coalesce(v_plan, 'free')), v_limit, replace(new.kind, 'inventory', 'inventory lots') using errcode = 'P0001';
  end if;
  return new;
end;
$$;
drop trigger if exists enforce_vault_membership_capacity on public.vault_records;
create trigger enforce_vault_membership_capacity before insert on public.vault_records
for each row execute function public.enforce_vault_membership_capacity();

create table if not exists public.ai_credit_usage (
  usage_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null,
  credits integer not null check (credits > 0),
  status text not null default 'reserved' check (status in ('reserved','completed','failed')),
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  provider_cost_microusd bigint not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists ai_credit_usage_user_month_idx on public.ai_credit_usage(user_id, created_at);
alter table public.ai_credit_usage enable row level security;
revoke all on public.ai_credit_usage from anon, authenticated;

create or replace function public.reserve_ai_credits(
  p_user_id uuid,
  p_usage_id uuid,
  p_feature text,
  p_credits integer,
  p_monthly_limit integer
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used integer;
  v_existing public.ai_credit_usage%rowtype;
begin
  if p_credits <= 0 or p_monthly_limit < 0 then raise exception 'Invalid AI credit request'; end if;
  perform pg_advisory_xact_lock(hashtext(p_user_id::text));
  select * into v_existing from public.ai_credit_usage where usage_id = p_usage_id;
  select coalesce(sum(credits), 0)::integer into v_used
    from public.ai_credit_usage
    where user_id = p_user_id and status in ('reserved','completed')
      and created_at >= date_trunc('month', now() at time zone 'utc') at time zone 'utc';
  if found and v_existing.usage_id is not null then
    return jsonb_build_object('allowed', v_existing.status <> 'failed', 'used', v_used, 'remaining', greatest(p_monthly_limit - v_used, 0));
  end if;
  if v_used + p_credits > p_monthly_limit then
    return jsonb_build_object('allowed', false, 'used', v_used, 'remaining', greatest(p_monthly_limit - v_used, 0));
  end if;
  insert into public.ai_credit_usage(usage_id,user_id,feature,credits) values(p_usage_id,p_user_id,p_feature,p_credits);
  return jsonb_build_object('allowed', true, 'used', v_used + p_credits, 'remaining', p_monthly_limit - v_used - p_credits);
end;
$$;
revoke all on function public.reserve_ai_credits(uuid,uuid,text,integer,integer) from public, anon, authenticated;
