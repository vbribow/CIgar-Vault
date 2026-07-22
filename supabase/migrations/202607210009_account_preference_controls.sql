alter table public.account_preferences add column if not exists email_notifications boolean not null default true;
alter table public.account_preferences add column if not exists wishlist_alerts boolean not null default true;
alter table public.account_preferences add column if not exists valuation_research boolean not null default true;
alter table public.account_preferences add column if not exists rating_research boolean not null default true;
alter table public.account_preferences add column if not exists product_analytics boolean not null default true;
