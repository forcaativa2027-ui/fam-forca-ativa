-- FAM005: revisão operacional de solicitações de encaminhamento.
-- Atendentes ativos não recebem acesso direto ao banco completo da FAM.

create or replace function public.fam_is_active_attendant()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.fam_attendants a
    where a.profile_id = auth.uid()
      and a.status = 'active'
  );
$$;

revoke all on function public.fam_is_active_attendant() from public;
grant execute on function public.fam_is_active_attendant() to authenticated;

-- A própria atendente ativa pode ser reconhecida; a função acima evita recursão RLS.
drop policy if exists fam_attendants_active_self_select on public.fam_attendants;
create policy fam_attendants_active_self_select on public.fam_attendants for select to authenticated
  using (profile_id = auth.uid() or public.fam_is_active_attendant());

-- Atendentes ativos podem revisar solicitações, mas não a usuária de outra conta.
drop policy if exists fam_referral_requests_operator_select on public.fam_referral_requests;
create policy fam_referral_requests_operator_select on public.fam_referral_requests for select to authenticated
  using (public.fam_is_active_attendant());

create or replace function public.fam_update_referral_status(
  p_request_id uuid,
  p_next_status text
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
begin
  if not public.fam_is_active_attendant() then
    raise exception 'active_attendant_required';
  end if;

  select * into current_request
  from public.fam_referral_requests
  where id = p_request_id
  for update;

  if current_request.id is null then
    raise exception 'referral_request_not_found';
  end if;

  allowed :=
    (current_request.status = 'requested' and p_next_status in ('under_review', 'cancelled')) or
    (current_request.status = 'under_review' and p_next_status in ('sent', 'cancelled')) or
    (current_request.status = 'sent' and p_next_status in ('received', 'cancelled'));

  if not allowed then
    raise exception 'invalid_referral_status_transition';
  end if;

  update public.fam_referral_requests
  set status = p_next_status,
      updated_at = now()
  where id = p_request_id
  returning * into updated_request;

  insert into public.fam_audit_events (
    actor_user_id,
    case_id,
    event_type,
    metadata
  ) values (
    auth.uid(),
    updated_request.case_id,
    'REFERRAL_STATUS_CHANGED',
    jsonb_build_object(
      'request_id', updated_request.id,
      'from_status', current_request.status,
      'to_status', updated_request.status,
      'recipient', updated_request.recipient
    )
  );

  return updated_request;
end;
$$;

revoke all on function public.fam_update_referral_status(uuid, text) from public;
grant execute on function public.fam_update_referral_status(uuid, text) to authenticated;

comment on function public.fam_update_referral_status(uuid, text) is 'Atualiza somente transições permitidas de solicitações FAM para atendentes ativos e registra auditoria técnica.';
