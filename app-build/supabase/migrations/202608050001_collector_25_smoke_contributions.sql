alter table public.account_preferences
  add column if not exists collector_25_contributions boolean not null default false;

alter table public.community_ratings
  add column if not exists contribution_source text not null default 'manual'
  check (contribution_source in ('manual', 'smoking-journal'));

comment on column public.account_preferences.collector_25_contributions is
  'Opt-in permission to share exact cigar identity and a current numeric smoking score anonymously with Collector 25.';

comment on column public.community_ratings.contribution_source is
  'Separates manual community entries from privacy-controlled smoking-journal score sync.';

create or replace function public.withdraw_smoking_journal_community_ratings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.collector_25_contributions is false then
    delete from public.community_ratings
    where user_id = new.user_id and contribution_source = 'smoking-journal';
  end if;
  return new;
end;
$$;

revoke all on function public.withdraw_smoking_journal_community_ratings() from public;

drop trigger if exists withdraw_smoking_journal_community_ratings on public.account_preferences;
create trigger withdraw_smoking_journal_community_ratings
after insert or update of collector_25_contributions on public.account_preferences
for each row execute function public.withdraw_smoking_journal_community_ratings();
