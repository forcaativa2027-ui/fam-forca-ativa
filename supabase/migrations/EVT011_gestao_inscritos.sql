-- ============================================================
-- CEC FAMILY — EVT011: Gestão de Inscritos (§20)
--  - Editar dados de uma inscrição direto na lista
--  - Mover manualmente entre confirmada e lista_espera
--    (ação administrativa — não passa pela checagem de capacidade
--    do register_for_event, é uma decisão consciente de quem tem
--    escopo sobre o evento)
-- Idempotente.
-- ============================================================

create or replace function public.admin_update_registration(
  p_registration_id uuid, p_full_name text, p_email text, p_phone text, p_cpf text
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_church_id uuid;
begin
  select e.church_id into v_church_id
  from public.event_registrations er join public.registration_events e on e.id = er.event_id
  where er.id = p_registration_id;

  if v_church_id is not null and v_church_id not in (select public.accessible_church_ids()) and not public.is_apostle() then
    raise exception 'Sem permissão para editar esta inscrição' using errcode = '42501';
  end if;
  if trim(coalesce(p_full_name, '')) = '' then
    raise exception 'Nome completo é obrigatório';
  end if;

  update public.event_registrations
  set full_name = trim(p_full_name), email = nullif(trim(coalesce(p_email,'')), ''),
      phone = nullif(trim(coalesce(p_phone,'')), ''), cpf = nullif(trim(coalesce(p_cpf,'')), '')
  where id = p_registration_id;
end; $$;
grant execute on function public.admin_update_registration(uuid, text, text, text, text) to authenticated;

-- ---------- Mover manualmente entre confirmada e lista_espera ----------
create or replace function public.admin_move_registration_status(p_registration_id uuid, p_new_status text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_church_id uuid;
  v_current text;
  v_event_id uuid;
begin
  if p_new_status not in ('confirmada', 'lista_espera') then
    raise exception 'Status inválido — use cancel_event_registration para cancelar';
  end if;

  select e.church_id, er.status::text, er.event_id into v_church_id, v_current, v_event_id
  from public.event_registrations er join public.registration_events e on e.id = er.event_id
  where er.id = p_registration_id;

  if v_current is null then raise exception 'Inscrição não encontrada'; end if;
  if v_church_id is not null and v_church_id not in (select public.accessible_church_ids()) and not public.is_apostle() then
    raise exception 'Sem permissão para alterar esta inscrição' using errcode = '42501';
  end if;
  if v_current = 'cancelada' then
    raise exception 'Inscrição cancelada — não é possível mover, é preciso reinscrever';
  end if;
  if v_current = p_new_status then return; end if;

  update public.event_registrations set status = p_new_status::event_signup_status where id = p_registration_id;

  -- Se moveu alguém pra fora da lista de espera direto pra confirmada,
  -- o próximo da fila continua na posição dele — nada a fazer.
  -- Se REBAIXOU um confirmado pra lista de espera, dá lugar aberto:
  -- promove o primeiro da fila automaticamente, do mesmo jeito que o cancelamento já faz.
  if v_current = 'confirmada' and p_new_status = 'lista_espera' then
    update public.event_registrations
    set status = 'confirmada', promoted_at = now(), promotion_notified = false
    where id = (
      select id from public.event_registrations
      where event_id = v_event_id and status = 'lista_espera' and id <> p_registration_id
      order by registered_at asc limit 1
    );
  end if;

  insert into public.audit_logs (actor_id, action, entity, entity_id, details)
  values (auth.uid(), 'update', 'event_registration_status', p_registration_id, jsonb_build_object('de', v_current, 'para', p_new_status));
end; $$;
grant execute on function public.admin_move_registration_status(uuid, text) to authenticated;
