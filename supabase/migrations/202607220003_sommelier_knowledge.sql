create table if not exists public.sommelier_knowledge (
  knowledge_id text primary key,
  category text not null check (category in ('cigar','spirit','cocktail','coffee','tea','nonalcoholic','pairing')),
  subject text not null,
  fact_type text not null,
  statement text not null,
  pairing_implications text not null default '',
  source_title text not null,
  source_url text not null,
  publisher text not null,
  evidence_date date not null,
  confidence text not null check (confidence in ('High','Medium','Developing')),
  status text not null default 'review' check (status in ('review','approved','rejected')),
  researched_at timestamptz not null default now(),
  reviewed_at timestamptz,
  review_note text
);
create index if not exists sommelier_knowledge_status_category_idx on public.sommelier_knowledge(status,category,researched_at desc);
alter table public.sommelier_knowledge enable row level security;
