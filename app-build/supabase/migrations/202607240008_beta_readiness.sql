create table if not exists public.account_consents (
  user_id uuid primary key references auth.users(id) on delete cascade,
  age_confirmed_at timestamptz not null,
  terms_version text not null,
  terms_accepted_at timestamptz not null,
  privacy_version text not null,
  privacy_accepted_at timestamptz not null,
  beta_version text not null,
  beta_accepted_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.account_consents enable row level security;
drop policy if exists "Users read own consents" on public.account_consents;
create policy "Users read own consents" on public.account_consents
  for select to authenticated using ((select auth.uid()) = user_id);

create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('Bug','Confusing','Suggestion','Trust or data','Other')),
  severity text not null check (severity in ('Low','Medium','High','Blocking')),
  page_url text,
  summary text not null,
  details text not null,
  status text not null default 'Open' check (status in ('Open','Reviewing','Resolved','Closed')),
  founder_note text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists beta_feedback_user_created_idx
  on public.beta_feedback(user_id, created_at desc);
create index if not exists beta_feedback_status_idx
  on public.beta_feedback(status, severity);

alter table public.beta_feedback enable row level security;
drop policy if exists "Users read own beta feedback" on public.beta_feedback;
create policy "Users read own beta feedback" on public.beta_feedback
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users create own beta feedback" on public.beta_feedback;
create policy "Users create own beta feedback" on public.beta_feedback
  for insert to authenticated with check ((select auth.uid()) = user_id);

create or replace function public.record_cedriva_signup_consent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.raw_user_meta_data->>'cedriva_consent_version', '') <> '' then
    insert into public.account_consents (
      user_id,
      age_confirmed_at,
      terms_version,
      terms_accepted_at,
      privacy_version,
      privacy_accepted_at,
      beta_version,
      beta_accepted_at
    ) values (
      new.id,
      coalesce((new.raw_user_meta_data->>'age_confirmed_at')::timestamptz, now()),
      new.raw_user_meta_data->>'cedriva_consent_version',
      now(),
      new.raw_user_meta_data->>'cedriva_consent_version',
      now(),
      new.raw_user_meta_data->>'cedriva_consent_version',
      now()
    )
    on conflict (user_id) do update set
      age_confirmed_at = excluded.age_confirmed_at,
      terms_version = excluded.terms_version,
      terms_accepted_at = excluded.terms_accepted_at,
      privacy_version = excluded.privacy_version,
      privacy_accepted_at = excluded.privacy_accepted_at,
      beta_version = excluded.beta_version,
      beta_accepted_at = excluded.beta_accepted_at,
      updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_cedriva_consent on auth.users;
create trigger on_auth_user_cedriva_consent
  after insert on auth.users
  for each row execute procedure public.record_cedriva_signup_consent();
