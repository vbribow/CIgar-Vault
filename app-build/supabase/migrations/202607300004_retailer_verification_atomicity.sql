create or replace function public.review_retailer_purchase(
  target_session_id uuid,
  review_decision text,
  review_note text
)
returns setof public.retailer_purchase_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  reviewed public.retailer_purchase_sessions%rowtype;
begin
  if review_decision not in ('verified','rejected') then
    raise exception 'Decision must be verified or rejected';
  end if;
  if char_length(trim(review_note)) not between 10 and 2000 then
    raise exception 'A clear verification note is required';
  end if;

  update public.retailer_purchase_sessions
  set status = review_decision,
      receipt_verified_at = case when review_decision = 'verified' then now() else null end,
      verification_note = trim(review_note),
      verification_actor = 'founder',
      updated_at = now()
  where id = target_session_id
    and status = 'evidence_pending'
    and order_reference_hash is not null
    and receipt_evidence_url is not null
    and purchase_date is not null
  returning * into reviewed;

  if reviewed.id is null then
    raise exception 'Complete pending purchase evidence was not found or was already reviewed';
  end if;

  insert into public.retailer_purchase_verification_events
    (purchase_session_id, decision, note, actor)
  values
    (target_session_id, review_decision, trim(review_note), 'founder');

  return next reviewed;
end;
$$;

revoke all on function public.review_retailer_purchase(uuid,text,text) from public, anon, authenticated;
grant execute on function public.review_retailer_purchase(uuid,text,text) to service_role;
