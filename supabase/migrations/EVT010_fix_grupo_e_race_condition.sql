-- ============================================================
-- CEC FAMILY — EVT010: correção de 2 bugs de lógica
--  1) Inscrição em grupo vinculava TODOS os acompanhantes ao
--     member_id de quem estava logado (só o titular deveria).
--     Isso também deixava a checagem de "já inscrito" pulável
--     via inscrição em grupo.
--  2) Condição de corrida na checagem de capacidade — duas
--     inscrições simultâneas podiam passar da capacidade porque
--     não havia trava de linha entre contar e decidir confirmada/
--     lista de espera.
-- Idempotente.
-- ============================================================

create or replace function public._register_one_for_event(
  p_event_id uuid, p_full_name text, p_email text, p_phone text, p_cpf text,
  p_accepted_privacy_policy boolean, p_accepted_image_use boolean,
  p_custom_answers jsonb, p_group_id uuid, p_is_titular boolean default true
) returns table(registration_id uuid, reg_status text, queue_position int)
language plpgsql security definer set search_path = public as $$
declare
  v_event record;
  v_confirmed_count int;
  v_member_id uuid;
  v_status text;
  v_id uuid;
  v_queue_pos int;
begin
  -- Trava a linha do evento: serializa inscrições concorrentes pro MESMO evento,
  -- evitando que duas pessoas "passem" da capacidade ao mesmo tempo.
  select * into v_event from public.registration_events where id = p_event_id for update;
  if v_event.id is null then raise exception 'Evento não encontrado'; end if;
  if v_event.status <> 'inscricoes_abertas' then raise exception 'Inscrições não estão abertas para este evento'; end if;
  if v_event.registration_opens_at is not null and now() < v_event.registration_opens_at then
    raise exception 'Inscrições ainda não abriram para este evento';
  end if;
  if v_event.registration_closes_at is not null and now() > v_event.registration_closes_at then
    raise exception 'Inscrições encerradas para este evento';
  end if;
  if trim(coalesce(p_full_name, '')) = '' then
    raise exception 'Informe o nome completo';
  end if;
  if not p_accepted_privacy_policy then
    raise exception 'É necessário aceitar a política de privacidade para se inscrever';
  end if;
  if v_event.requires_cpf and trim(coalesce(p_cpf, '')) = '' then
    raise exception 'CPF é obrigatório para este evento';
  end if;
  if p_cpf is not null and trim(p_cpf) <> '' and exists (
    select 1 from public.event_registrations er
    where er.event_id = p_event_id and er.cpf = p_cpf and er.status <> 'cancelada'
  ) then
    raise exception 'Este CPF já está inscrito neste evento';
  end if;

  -- Só o titular (quem está de fato logado) é vinculado ao próprio member_id.
  -- Acompanhantes de uma inscrição em grupo NÃO são a mesma pessoa —
  -- ficam com member_id nulo, igual a uma inscrição de visitante.
  if p_is_titular then
    select m.id into v_member_id from public.members m where m.profile_id = auth.uid() limit 1;
  else
    v_member_id := null;
  end if;

  if v_member_id is not null and exists (
    select 1 from public.event_registrations er
    where er.event_id = p_event_id and er.member_id = v_member_id and er.status <> 'cancelada'
  ) then
    raise exception 'Você já está inscrito neste evento';
  end if;

  select count(*) into v_confirmed_count from public.event_registrations
  where event_id = p_event_id and status = 'confirmada';

  if v_event.capacity is not null and v_confirmed_count >= v_event.capacity then
    v_status := 'lista_espera';
  else
    v_status := 'confirmada';
  end if;

  insert into public.event_registrations (
    event_id, member_id, full_name, email, phone, cpf,
    accepted_privacy_policy, accepted_image_use, custom_answers, group_id, status,
    snapshot_start_at, snapshot_location, snapshot_is_online, snapshot_online_url, snapshot_event_status
  ) values (
    p_event_id, v_member_id, p_full_name, p_email, p_phone, nullif(trim(coalesce(p_cpf, '')), ''),
    p_accepted_privacy_policy, p_accepted_image_use, coalesce(p_custom_answers, '{}'::jsonb), p_group_id, v_status::event_signup_status,
    v_event.start_at, v_event.location, v_event.is_online, v_event.online_url, v_event.status::text
  ) returning id into v_id;

  if v_status = 'lista_espera' then
    select count(*) into v_queue_pos from public.event_registrations
    where event_id = p_event_id and status = 'lista_espera' and registered_at <= (select registered_at from public.event_registrations where id = v_id);
  else
    v_queue_pos := null;
  end if;

  return query select v_id, v_status, v_queue_pos;
end;
$$;

-- ---------- register_group_for_event: só o 1º participante é o titular ----------
create or replace function public.register_group_for_event(
  p_event_id uuid, p_participants jsonb,
  p_accepted_privacy_policy boolean default false, p_accepted_image_use boolean default false
) returns table(registration_id uuid, reg_status text, queue_position int, full_name text)
language plpgsql security definer set search_path = public as $$
declare
  v_group_id uuid := gen_random_uuid();
  v_participant jsonb;
  v_reg record;
  v_idx int := 0;
begin
  if jsonb_array_length(p_participants) = 0 then
    raise exception 'Informe ao menos um participante';
  end if;
  if jsonb_array_length(p_participants) > 10 then
    raise exception 'Máximo de 10 participantes por inscrição em grupo';
  end if;

  for v_participant in select * from jsonb_array_elements(p_participants) loop
    v_idx := v_idx + 1;
    select * into v_reg from public._register_one_for_event(
      p_event_id,
      v_participant->>'full_name',
      v_participant->>'email',
      v_participant->>'phone',
      v_participant->>'cpf',
      p_accepted_privacy_policy,
      p_accepted_image_use,
      coalesce(v_participant->'custom_answers', '{}'::jsonb),
      v_group_id,
      v_idx = 1  -- só o primeiro participante é o titular (quem está logado)
    );
    registration_id := v_reg.registration_id;
    reg_status := v_reg.reg_status;
    queue_position := v_reg.queue_position;
    full_name := v_participant->>'full_name';
    return next;
  end loop;
end;
$$;
grant execute on function public.register_group_for_event(uuid, jsonb, boolean, boolean) to anon, authenticated;
