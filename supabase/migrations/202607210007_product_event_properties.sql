alter table public.product_events add column if not exists properties jsonb not null default '{}'::jsonb;
