create or replace function public.record_cedriva_signup_consent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  consent_version text;
begin
  consent_version := coalesce(
    nullif(new.raw_user_meta_data->>'hojavia_consent_version', ''),
    nullif(new.raw_user_meta_data->>'cedriva_consent_version', '')
  );

  if consent_version is not null then
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
      consent_version,
      now(),
      consent_version,
      now(),
      consent_version,
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

revoke all on function public.record_cedriva_signup_consent() from public;
revoke execute on function public.record_cedriva_signup_consent() from anon;
revoke execute on function public.record_cedriva_signup_consent() from authenticated;
