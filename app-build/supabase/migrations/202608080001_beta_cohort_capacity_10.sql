-- Applies only after the approved migration-reconciliation and recovery process.
-- Keeps the private, founder-approved beta at a maximum of 10 active seats.
create or replace function public.enforce_hojavia_beta_cohort_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  occupied integer;
begin
  if new.stage = 'Prospect' then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext('hojavia-founder-beta-cohort'));
  select count(*) into occupied
  from public.beta_collectors
  where stage <> 'Prospect'
    and (tg_op = 'INSERT' or id <> new.id);

  if occupied >= 10 then
    raise exception using
      errcode = '23514',
      message = 'The 10-collector founder cohort is full.';
  end if;
  return new;
end;
$$;
