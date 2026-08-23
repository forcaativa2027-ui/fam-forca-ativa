-- ============================================================
-- CEC FAMILY — EVT002b: aplica o ciclo de vida novo + campos de
-- cadastro que faltavam (CEC-EVT-001, seções 6 e 7.1)
-- Rodar DEPOIS do EVT002a (que só adiciona os valores do enum).
-- Idempotente.
-- ============================================================

-- ---------- 1) Novas colunas de cadastro ----------
alter table public.registration_events add column if not exists category text;
alter table public.registration_events add column if not exists subtitle text;
alter table public.registration_events add column if not exists target_audience text;
alter table public.registration_events add column if not exists highlight_dashboard boolean not null default false;
alter table public.registration_events add column if not exists highlight_public boolean not null default false;

comment on column public.registration_events.category is
  'Texto livre (não enum) — a comunidade pode criar categorias novas sem precisar de migration. Sugestões ficam na UI.';

-- ---------- 2) Migra dados existentes pro novo vocabulário de status ----------
update public.registration_events set status = 'inscricoes_abertas' where status = 'publicado';
update public.registration_events set status = 'inscricoes_encerradas' where status = 'encerrado';

-- ---------- 3) Leitura pública: quais status ficam visíveis sem login ----------
drop policy if exists regevents_public_read on public.registration_events;
create policy regevents_public_read on public.registration_events for select to anon, authenticated
  using (
    status in (
      'agendado', 'inscricoes_abertas', 'inscricoes_encerradas',
      'lotado', 'em_andamento', 'finalizado', 'cancelado'
    )
  );
-- Rascunho, Em revisão e Arquivado continuam invisíveis pro público —
-- só quem tem escopo sobre a igreja (regevents_staff_read) os enxerga.

-- ---------- 4) register_for_event: só aceita inscrição em 'inscricoes_abertas' ----------
create or replace function public.register_for_event(
  p_event_id uuid, p_full_name text, p_email text default null, p_phone text default null
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

  select m.id into v_member_id from public.members m where m.profile_id = auth.uid() limit 1;

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

  insert into public.event_registrations (event_id, member_id, full_name, email, phone, status)
  values (p_event_id, v_member_id, p_full_name, p_email, p_phone, v_status::event_signup_status)
  returning id into v_id;

  if v_status = 'lista_espera' then
    select count(*) into v_queue_pos from public.event_registrations
    where event_id = p_event_id and status = 'lista_espera' and registered_at <= (select registered_at from public.event_registrations where id = v_id);
  else
    v_queue_pos := null;
  end if;

  return query select v_id, v_status, v_queue_pos;
end;
$$;
grant execute on function public.register_for_event(uuid, text, text, text) to anon, authenticated;
