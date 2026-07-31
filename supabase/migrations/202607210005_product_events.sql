create table if not exists public.product_events(id bigint generated always as identity primary key,user_id uuid not null references auth.users(id) on delete cascade,event_type text not null,created_at timestamptz not null default now());
create index if not exists product_events_user_type_idx on public.product_events(user_id,event_type,created_at desc);
alter table public.product_events enable row level security;
drop policy if exists "Users create own product events" on public.product_events;
create policy "Users create own product events" on public.product_events for insert to authenticated with check ((select auth.uid())=user_id);
