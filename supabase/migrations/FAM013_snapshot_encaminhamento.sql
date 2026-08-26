-- FAM013 — Snapshot imutável do pacote de encaminhamento enviado
-- Aditiva; preserva o registro original e não realiza envio externo.

alter table public.fam_referral_requests
  add column if not exists sent_at timestamptz,
  add column if not exists sent_package_snapshot jsonb,
  add column if not exists sent_package_hash text;

drop function if exists public.fam_update_referral_status(uuid, text, boolean, text);

create or replace function public.fam_update_referral_status(
  p_request_id uuid,
  p_next_status text,
  p_operator_confirmed boolean default false,
  p_confirmation_note text default null
)
returns public.fam_referral_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  current_request public.fam_referral_requests;
  updated_request public.fam_referral_requests;
  allowed boolean := false;
  package_snapshot jsonb;
begin
  if not public.fam_is_active_attendant() then raise exception 'active_attendant_required'; end if;
  select * into current_request from public.fam_referral_requests where id = p_request_id for update;
  if current_request.id is null then raise exception 'referral_request_not_found'; end if;

  allowed :=
    (current_request.status = 'requested' and p_next_status in ('under_review', 'cancelled')) or
    (current_request.status = 'under_review' and p_next_status in ('sent', 'cancelled')) or
    (current_request.status = 'sent' and p_next_status in ('received', 'cancelled'));
  if not allowed then raise exception 'invalid_referral_status_transition'; end if;
  if p_next_status = 'sent' and (not p_operator_confirmed or nullif(trim(coalesce(p_confirmation_note, '')), '') is null) then
    raise exception 'operator_confirmation_required';
  end if;

  package_snapshot := jsonb_build_object(
    'request_id', current_request.id,
    'case_id', current_request.case_id,
    'requested_by', current_request.requested_by,
    'recipient', current_request.recipient,
    'purpose', current_request.purpose,
    'priority', current_request.priority,
    'reason_code', current_request.reason_code,
    'requested_data', current_request.requested_data,
    'selected_attachment_ids', current_request.selected_attachment_ids,
    'explicit_confirmation_at', current_request.explicit_confirmation_at,
    'operator_confirmation_note', case when p_next_status = 'sent' then trim(p_confirmation_note) else null end
  );

  update public.fam_referral_requests
  set status = p_next_status,
      updated_at = now(),
      operator_confirmed_at = case when p_next_status = 'sent' then now() else operator_confirmed_at end,
      operator_confirmed_by = case when p_next_status = 'sent' then auth.uid() else operator_confirmed_by end,
      operator_confirmation_note = case when p_next_status = 'sent' then trim(p_confirmation_note) else operator_confirmation_note end,
      sent_at = case when p_next_status = 'sent' then now() else sent_at end,
      sent_package_snapshot = case when p_next_status = 'sent' then package_snapshot else sent_package_snapshot end,
      sent_package_hash = case when p_next_status = 'sent' then md5(package_snapshot::text) else sent_package_hash end
  where id = p_request_id
  returning * into updated_request;

  insert into public.fam_audit_events (actor_user_id, case_id, event_type, metadata)
  values (auth.uid(), updated_request.case_id, 'REFERRAL_STATUS_CHANGED', jsonb_build_object(
    'request_id', updated_request.id,
    'from_status', current_request.status,
    'to_status', updated_request.status,
    'recipient', updated_request.recipient,
    'operator_confirmed', p_next_status = 'sent',
    'package_frozen', p_next_status = 'sent',
    'sent_package_hash', updated_request.sent_package_hash
  ));
  return updated_request;
end;
$$;

revoke all on function public.fam_update_referral_status(uuid, text, boolean, text) from public;
grant execute on function public.fam_update_referral_status(uuid, text, boolean, text) to authenticated;
