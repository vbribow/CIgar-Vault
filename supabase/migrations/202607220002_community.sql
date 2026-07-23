create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null, category text not null, title text not null, body text not null,
  status text not null default 'review' check (status in ('active','review','hidden')),
  moderation_reason text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists community_posts_status_created_idx on public.community_posts(status,created_at desc);

create table if not exists public.community_ratings (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null, cigar_key text not null, brand text not null, line text not null, vitola text not null,
  vintage text, score integer not null check (score between 1 and 100), review text,
  status text not null default 'review' check (status in ('active','review','hidden')),
  moderation_reason text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(user_id,cigar_key)
);
create index if not exists community_ratings_status_key_idx on public.community_ratings(status,cigar_key);

alter table public.community_posts enable row level security;
alter table public.community_ratings enable row level security;
create policy "active community posts are readable" on public.community_posts for select using (status='active' or auth.uid()=user_id);
create policy "active community ratings are readable" on public.community_ratings for select using (status='active' or auth.uid()=user_id);
