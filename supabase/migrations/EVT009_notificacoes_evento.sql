-- ============================================================
-- CEC FAMILY — EVT009: Notificações do evento (§21)
-- Sem infraestrutura de e-mail/cron neste projeto, a estratégia é:
--  - Mudança de horário/local/cancelamento: guarda um "retrato" dos
--    dados do evento no momento da inscrição, e compara com os dados
--    atuais sempre que o membro abre o painel (sem precisar de job
--    agendado).
--  - Lembrete do evento: calculado ao vivo no cliente (evento nas
--    próximas 48h), sem precisar de tabela nova.
-- Idempotente.
-- ============================================================

-- ---------- 1) "Retrato" da inscrição + motivo de cancelamento do evento ----------
alter table public.event_registrations add column if not exists snapshot_start_at timestamptz;
alter table public.event_registrations add column if not exists snapshot_location text;
alter table public.event_registrations add column if not exists snapshot_is_online boolean;
alter table public.event_registrations add column if not exists snapshot_online_url text;
alter table public.event_registrations add column if not exists snapshot_event_status text;

alter table public.registration_events add column if not exists cancellation_reason text;

-- Preenche o retrato de quem já tinha se inscrito antes deste arquivo existir,
-- pra não gerar um monte de "mudança" falsa logo na virada.
update public.event_registrations er
set snapshot_start_at = e.start_at, snapshot_location = e.location,
    snapshot_is_online = e.is_online, snapshot_online_url = e.online_url,
    snapshot_event_status = e.status::text
from public.registration_events e
where er.event_id = e.id and er.snapshot_start_at is null;

-- ---------- 2) _register_one_for_event: grava o retrato no momento da inscrição ----------
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

-- ---------- 3) Mudanças pendentes de aviso pro membro logado ----------
create or replace function public.list_my_event_changes()
returns table (
  registration_id uuid, event_id uuid, event_name text, event_slug text,
  change_type text, old_start_at timestamptz, new_start_at timestamptz,
  old_location text, new_location text, cancellation_reason text
)
language sql stable security definer set search_path = public as $$
  select
    er.id, e.id, e.name, e.slug,
    case
      when e.status = 'cancelado' and er.snapshot_event_status <> 'cancelado' then 'cancelado'
      when e.start_at <> er.snapshot_start_at then 'horario'
      when coalesce(e.location,'') <> coalesce(er.snapshot_location,'') or e.is_online <> er.snapshot_is_online then 'local'
      else null
    end,
    er.snapshot_start_at, e.start_at,
    er.snapshot_location, e.location,
    e.cancellation_reason
  from public.event_registrations er
  join public.registration_events e on e.id = er.event_id
  join public.members m on m.id = er.member_id
  where m.profile_id = auth.uid()
    and er.status <> 'cancelada'
    and (
      (e.status = 'cancelado' and er.snapshot_event_status <> 'cancelado')
      or e.start_at <> er.snapshot_start_at
      or coalesce(e.location,'') <> coalesce(er.snapshot_location,'')
      or e.is_online <> er.snapshot_is_online
    );
$$;
grant execute on function public.list_my_event_changes() to authenticated;

-- ---------- 4) Confirmar que o membro já viu a mudança (atualiza o retrato) ----------
create or replace function public.acknowledge_event_change(p_registration_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.event_registrations er
  set snapshot_start_at = e.start_at, snapshot_location = e.location,
      snapshot_is_online = e.is_online, snapshot_online_url = e.online_url,
      snapshot_event_status = e.status::text
  from public.registration_events e, public.members m
  where er.id = p_registration_id and er.event_id = e.id and er.member_id = m.id and m.profile_id = auth.uid();
end;
$$;
grant execute on function public.acknowledge_event_change(uuid) to authenticated;
