-- ============================================================
-- CEC FAMILY — EVT004: Inscrição enriquecida (CEC-EVT-001, seção 12)
--  - CPF opcional/obrigatório por evento, com checagem de duplicidade
--    (só dentro do MESMO evento — não é um cadastro global de pessoa)
--  - Aceite obrigatório da política de privacidade
--  - Autorização de uso de imagem (opcional, configurável por evento)
--  - Campos personalizados (12.3): guardados como JSON no próprio
--    evento (sem tabela nova) — texto curto/longo, seleção única/
--    múltipla, sim/não, data. Upload de documento fica de fora deste
--    lote (precisa de bucket de storage próprio).
--  - Inscrição familiar/em grupo (12.1): várias pessoas na mesma
--    submissão, compartilhando um group_id.
-- Idempotente.
-- ============================================================

-- ---------- 1) Configuração por evento ----------
alter table public.registration_events add column if not exists requires_cpf boolean not null default false;
alter table public.registration_events add column if not exists requires_image_consent boolean not null default false;
alter table public.registration_events add column if not exists custom_fields jsonb not null default '[]'::jsonb;
comment on column public.registration_events.custom_fields is
  'Array de perguntas extras definidas pelo admin. Formato: [{"id":"uuid","label":"...","type":"texto_curto|texto_longo|selecao_unica|selecao_multipla|sim_nao|data","options":["..."],"required":true}]';

-- ---------- 2) Dados novos na inscrição ----------
alter table public.event_registrations add column if not exists cpf text;
alter table public.event_registrations add column if not exists accepted_privacy_policy boolean not null default false;
alter table public.event_registrations add column if not exists accepted_image_use boolean not null default false;
alter table public.event_registrations add column if not exists custom_answers jsonb not null default '{}'::jsonb;
alter table public.event_registrations add column if not exists group_id uuid;

create index if not exists idx_event_registrations_group on public.event_registrations(group_id) where group_id is not null;

-- CPF duplicado só é bloqueado DENTRO do mesmo evento, e só entre inscrições não canceladas.
create unique index if not exists uq_event_registrations_cpf_per_event
  on public.event_registrations(event_id, cpf)
  where cpf is not null and status <> 'cancelada';

-- ---------- 3) Função interna compartilhada (individual e grupo chamam a mesma lógica) ----------
create or replace function public._register_one_for_event(
  p_event_id uuid, p_full_name text, p_email text, p_phone text, p_cpf text,
  p_accepted_privacy_policy boolean, p_accepted_image_use boolean,
  p_custom_answers jsonb, p_group_id uuid
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
  select * into v_event from public.registration_events where id = p_event_id;
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

  select m.id into v_member_id from public.members m where m.profile_id = auth.uid() limit 1;

  if v_member_id is not null and p_group_id is null and exists (
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
    accepted_privacy_policy, accepted_image_use, custom_answers, group_id, status
  ) values (
    p_event_id, v_member_id, p_full_name, p_email, p_phone, nullif(trim(coalesce(p_cpf, '')), ''),
    p_accepted_privacy_policy, p_accepted_image_use, coalesce(p_custom_answers, '{}'::jsonb), p_group_id, v_status::event_signup_status
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

-- ---------- 4) Inscrição individual (assinatura nova, com CPF/LGPD/campos custom) ----------
drop function if exists public.register_for_event(uuid, text, text, text);
create or replace function public.register_for_event(
  p_event_id uuid, p_full_name text, p_email text default null, p_phone text default null,
  p_cpf text default null, p_accepted_privacy_policy boolean default false,
  p_accepted_image_use boolean default false, p_custom_answers jsonb default '{}'::jsonb
) returns table(registration_id uuid, reg_status text, queue_position int)
language sql security definer set search_path = public as $$
  select * from public._register_one_for_event(
    p_event_id, p_full_name, p_email, p_phone, p_cpf,
    p_accepted_privacy_policy, p_accepted_image_use, p_custom_answers, null
  );
$$;
grant execute on function public.register_for_event(uuid, text, text, text, text, boolean, boolean, jsonb) to anon, authenticated;

-- ---------- 5) Inscrição familiar/em grupo ----------
-- p_participants: array de {"full_name":"...","email":"...","phone":"...","cpf":"...","custom_answers":{...}}
create or replace function public.register_group_for_event(
  p_event_id uuid, p_participants jsonb,
  p_accepted_privacy_policy boolean default false, p_accepted_image_use boolean default false
) returns table(registration_id uuid, reg_status text, queue_position int, full_name text)
language plpgsql security definer set search_path = public as $$
declare
  v_group_id uuid := gen_random_uuid();
  v_participant jsonb;
  v_reg record;
begin
  if jsonb_array_length(p_participants) = 0 then
    raise exception 'Informe ao menos um participante';
  end if;
  if jsonb_array_length(p_participants) > 10 then
    raise exception 'Máximo de 10 participantes por inscrição em grupo';
  end if;

  for v_participant in select * from jsonb_array_elements(p_participants) loop
    select * into v_reg from public._register_one_for_event(
      p_event_id,
      v_participant->>'full_name',
      v_participant->>'email',
      v_participant->>'phone',
      v_participant->>'cpf',
      p_accepted_privacy_policy,
      p_accepted_image_use,
      coalesce(v_participant->'custom_answers', '{}'::jsonb),
      v_group_id
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
