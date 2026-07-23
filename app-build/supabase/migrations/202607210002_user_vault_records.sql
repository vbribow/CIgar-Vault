create table if not exists public.vault_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('inventory','collections','humidors','readings','sensors','valuations','smokes','activities')),
  record_id text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, record_id)
);
create index if not exists vault_records_user_kind_idx on public.vault_records(user_id, kind);
alter table public.vault_records enable row level security;
drop policy if exists "Users read own vault records" on public.vault_records;
create policy "Users read own vault records" on public.vault_records for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users create own vault records" on public.vault_records;
create policy "Users create own vault records" on public.vault_records for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users update own vault records" on public.vault_records;
create policy "Users update own vault records" on public.vault_records for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users delete own vault records" on public.vault_records;
create policy "Users delete own vault records" on public.vault_records for delete to authenticated using ((select auth.uid()) = user_id);
