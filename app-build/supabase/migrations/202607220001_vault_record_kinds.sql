alter table public.vault_records drop constraint if exists vault_records_kind_check;

alter table public.vault_records
  add constraint vault_records_kind_check
  check (
    kind in (
      'inventory',
      'collections',
      'humidors',
      'readings',
      'sensors',
      'valuations',
      'ratings',
      'rating-drafts',
      'smokes',
      'activities',
      'wishlist',
      'integrity',
      'system-runs'
    )
  );
