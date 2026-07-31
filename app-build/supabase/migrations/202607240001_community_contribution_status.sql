alter table public.community_posts
  drop constraint if exists community_posts_status_check;
alter table public.community_posts
  add constraint community_posts_status_check
  check (status in ('active','review','changes','hidden'));

alter table public.community_ratings
  drop constraint if exists community_ratings_status_check;
alter table public.community_ratings
  add constraint community_ratings_status_check
  check (status in ('active','review','changes','hidden'));
