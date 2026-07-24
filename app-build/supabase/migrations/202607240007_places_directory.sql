create table if not exists public.community_locations(
 google_place_id text primary key,
 last_verified_at timestamptz,
 created_at timestamptz not null default now()
);
create table if not exists public.place_reviews(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 google_place_id text not null references public.community_locations(google_place_id) on delete cascade,
 display_name text not null,
 score integer not null check(score between 1 and 100),
 visit_date date not null,
 vibes text[] not null default '{}',
 capabilities text[] not null default '{}',
 review text not null,
 conflict_disclosure text,
 status text not null check(status in('active','review')) default 'review',
 moderation_reason text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(user_id,google_place_id)
);
create table if not exists public.place_certifications(
 id uuid primary key default gen_random_uuid(),
 google_place_id text not null references public.community_locations(google_place_id) on delete cascade,
 level text not null check(level in('Cedriva Certified','Cedriva Distinguished','Cedriva Destination','Not Yet Certified')),
 score integer not null check(score between 1 and 100),
 visit_month text not null,
 summary text not null,
 strengths text not null,
 opportunities text,
 complimentary_disclosure text,
 next_review_date date not null,
 active boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.location_verification_events(
 id uuid primary key default gen_random_uuid(),
 google_place_id text not null references public.community_locations(google_place_id) on delete cascade,
 checked_at timestamptz not null default now(),
 outcome text not null check(outcome in('reachable','attention')),
 detail text not null
);
alter table public.community_locations enable row level security;
alter table public.place_reviews enable row level security;
alter table public.place_certifications enable row level security;
alter table public.location_verification_events enable row level security;
create policy "public active place reviews" on public.place_reviews for select using(status='active');
create policy "public active certifications" on public.place_certifications for select using(active=true);
create index if not exists place_reviews_place_idx on public.place_reviews(google_place_id,status);
create index if not exists place_certifications_place_idx on public.place_certifications(google_place_id,active);
