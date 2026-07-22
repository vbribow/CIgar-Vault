create table if not exists public.account_preferences(user_id uuid primary key references auth.users(id) on delete cascade,upgrade_recommendations boolean not null default true,upgrade_snoozed_until timestamptz,updated_at timestamptz not null default now());
alter table public.account_preferences enable row level security;
drop policy if exists "Users read own preferences" on public.account_preferences;
create policy "Users read own preferences" on public.account_preferences for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "Users create own preferences" on public.account_preferences;
create policy "Users create own preferences" on public.account_preferences for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists "Users update own preferences" on public.account_preferences;
create policy "Users update own preferences" on public.account_preferences for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
