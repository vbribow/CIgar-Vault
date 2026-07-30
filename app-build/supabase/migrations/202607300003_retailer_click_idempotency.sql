create unique index if not exists retailer_purchase_sessions_open_click_idx
  on public.retailer_purchase_sessions(user_id, listing_fingerprint)
  where status = 'clicked';
