drop trigger if exists withdraw_smoking_journal_community_ratings on public.account_preferences;
drop function if exists public.withdraw_smoking_journal_community_ratings();

alter table public.account_preferences
  alter column collector_25_contributions set default true;

update public.account_preferences
set collector_25_contributions = true
where collector_25_contributions is false;

comment on column public.account_preferences.collector_25_contributions is
  'Legacy compatibility field. Exact cigar identity and numeric smoking score contribute anonymously by default; private collector data is never included.';

comment on column public.community_ratings.contribution_source is
  'Separates manual community entries from automatic anonymous smoking-journal score synchronization.';
