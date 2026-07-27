create or replace function public.repair_adjacent_duplicate_smoke(p_inventory_id text)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  owner_id uuid := auth.uid();
  smoke_rows public.vault_records[];
  inventory_row public.vault_records;
  older public.vault_records;
  newer public.vault_records;
  backup_id text;
  repaired_inventory jsonb;
  current_qty integer;
  smoked_qty integer;
  loose_stick_qty integer;
begin
  if owner_id is null then raise exception 'Sign in before repairing private records'; end if;

  select array_agg(row_value order by row_value.updated_at, row_value.record_id)
    into smoke_rows
  from public.vault_records row_value
  where row_value.user_id = owner_id
    and row_value.kind = 'smokes'
    and row_value.payload->>'inventoryId' = p_inventory_id;

  if coalesce(array_length(smoke_rows, 1), 0) <> 2 then
    raise exception 'Repair requires exactly two smoking records for this inventory lot';
  end if;
  older := smoke_rows[1];
  newer := smoke_rows[2];
  if (older.payload - 'smokeId') <> (newer.payload - 'smokeId') then
    raise exception 'The two smoking records are not exact duplicates';
  end if;
  if newer.updated_at - older.updated_at > interval '10 minutes' then
    raise exception 'The records are not temporally adjacent';
  end if;

  select * into inventory_row
  from public.vault_records
  where user_id = owner_id and kind = 'inventory' and record_id = p_inventory_id
  for update;
  if inventory_row.record_id is null then raise exception 'Inventory record was not found'; end if;

  current_qty := coalesce((inventory_row.payload->>'currentQty')::integer, 0);
  smoked_qty := coalesce((inventory_row.payload->>'smokedQty')::integer, 0);
  repaired_inventory := jsonb_set(
    jsonb_set(inventory_row.payload, '{currentQty}', to_jsonb(current_qty + 1), true),
    '{smokedQty}', to_jsonb(greatest(0, smoked_qty - 1)), true
  );
  if inventory_row.payload ? 'looseStickQty' then
    loose_stick_qty := coalesce((inventory_row.payload->>'looseStickQty')::integer, 0);
    repaired_inventory := jsonb_set(
      repaired_inventory,
      '{looseStickQty}',
      to_jsonb(loose_stick_qty + 1),
      true
    );
  end if;
  backup_id := 'REPAIR-BACKUP-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS') || '-' || gen_random_uuid()::text;

  insert into public.vault_records(user_id, kind, record_id, payload, updated_at)
  values (
    owner_id,
    'integrity',
    backup_id,
    jsonb_build_object(
      'action', 'adjacent-duplicate-smoke-repair',
      'inventoryId', p_inventory_id,
      'preservedSmokeId', older.record_id,
      'removedSmokeId', newer.record_id,
      'smokeSnapshots', jsonb_build_array(older.payload, newer.payload),
      'inventoryBefore', inventory_row.payload,
      'inventoryAfter', repaired_inventory,
      'createdAt', clock_timestamp()
    ),
    clock_timestamp()
  );

  delete from public.vault_records
  where user_id = owner_id and kind = 'smokes' and record_id = newer.record_id;
  update public.vault_records
  set payload = repaired_inventory, updated_at = clock_timestamp()
  where user_id = owner_id and kind = 'inventory' and record_id = p_inventory_id;

  return jsonb_build_object(
    'inventoryId', p_inventory_id,
    'preservedSmokeId', older.record_id,
    'removedSmokeId', newer.record_id,
    'backupId', backup_id,
    'restoredUnits', 1
  );
end;
$$;

revoke all on function public.repair_adjacent_duplicate_smoke(text) from public;
grant execute on function public.repair_adjacent_duplicate_smoke(text) to authenticated;
