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

  if occupied >= 25 then
    raise exception using
      errcode = '23514',
      message = 'The 25-collector founder cohort is full.';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_hojavia_beta_cohort_capacity on public.beta_collectors;
create trigger enforce_hojavia_beta_cohort_capacity
  before insert or update of stage on public.beta_collectors
  for each row execute procedure public.enforce_hojavia_beta_cohort_capacity();
