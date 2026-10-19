-- Keep recent, owner-scoped history reads bounded without sorting an account's
-- complete record archive in memory. This supports climate dashboards and any
-- future recent-record view that uses the same access path.
create index if not exists vault_records_user_kind_updated_record_idx
  on public.vault_records (user_id, kind, updated_at desc, record_id desc);
