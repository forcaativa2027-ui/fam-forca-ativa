-- FAM014 — Verificação de integridade do pacote congelado
-- Não altera o snapshot; apenas recalcula e registra o resultado.

create or replace function public.fam_verify_referral_package(p_request_id uuid)
returns table(request_id uuid, is_valid boolean, package_hash text, verified_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.fam_referral_requests;
  calculated_hash text;
  result_time timestamptz := now();
begin
  if not public.fam_is_active_attendant() then raise exception 'active_attendant_required'; end if;
  select * into request_row from public.fam_referral_requests where id = p_request_id;
  if request_row.id is null then raise exception 'referral_request_not_found'; end if;
  if request_row.sent_package_snapshot is null or request_row.sent_package_hash is null then raise exception 'referral_package_not_frozen'; end if;

  calculated_hash := md5(request_row.sent_package_snapshot::text);
  insert into public.fam_audit_events (actor_user_id, case_id, event_type, metadata)
  values (
    auth.uid(), request_row.case_id, 'REFERRAL_PACKAGE_INTEGRITY_CHECKED',
    jsonb_build_object('request_id', request_row.id, 'is_valid', calculated_hash = request_row.sent_package_hash, 'package_hash', request_row.sent_package_hash, 'calculated_hash', calculated_hash)
  );
  return query select request_row.id, calculated_hash = request_row.sent_package_hash, request_row.sent_package_hash, result_time;
end;
$$;

revoke all on function public.fam_verify_referral_package(uuid) from public;
grant execute on function public.fam_verify_referral_package(uuid) to authenticated;
