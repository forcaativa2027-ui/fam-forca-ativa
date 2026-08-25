-- ============================================================
-- CEC FAMILY — EVT005: QR Code e Check-in (CEC-EVT-001, seção 15)
-- O "QR Code" é a própria inscrição: o conteúdo do código é a URL
-- pública /checkin/<registration_id> (padrão idêntico ao já usado
-- pela Carteira CEC ID em qrCodeImageUrl()).
-- Idempotente.
-- ============================================================

alter table public.event_registrations add column if not exists checked_in_at timestamptz;
alter table public.event_registrations add column if not exists checked_in_by uuid references public.profiles(id);

create index if not exists idx_event_registrations_checkin on public.event_registrations(event_id, checked_in_at);

-- ---------- Consultar uma inscrição pelo id (leitura de QR ou clique na busca manual) ----------
create or replace function public.lookup_event_registration_for_checkin(p_registration_id uuid)
returns table (
  registration_id uuid, event_id uuid, full_name text, email text, phone text,
  status text, checked_in_at timestamptz, group_id uuid, event_name text
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_church_id uuid;
begin
  select e.church_id into v_church_id
  from public.event_registrations er join public.registration_events e on e.id = er.event_id
  where er.id = p_registration_id;

  if v_church_id is not null and v_church_id not in (select public.accessible_church_ids()) and not public.is_apostle() then
    raise exception 'Sem permissão para acessar esta inscrição' using errcode = '42501';
  end if;

  return query
  select er.id, er.event_id, er.full_name, er.email, er.phone,
         er.status::text, er.checked_in_at, er.group_id, e.name
  from public.event_registrations er
  join public.registration_events e on e.id = er.event_id
  where er.id = p_registration_id;
end; $$;
grant execute on function public.lookup_event_registration_for_checkin(uuid) to authenticated;

-- ---------- Busca manual por nome/e-mail/telefone dentro de um evento ----------
create or replace function public.search_event_registrations(p_event_id uuid, p_query text)
returns table (
  registration_id uuid, full_name text, email text, phone text,
  status text, checked_in_at timestamptz, group_id uuid
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_church_id uuid;
begin
  select church_id into v_church_id from public.registration_events where id = p_event_id;
  if v_church_id is not null and v_church_id not in (select public.accessible_church_ids()) and not public.is_apostle() then
    raise exception 'Sem permissão para ver os inscritos deste evento' using errcode = '42501';
  end if;

  return query
  select er.id, er.full_name, er.email, er.phone, er.status::text, er.checked_in_at, er.group_id
  from public.event_registrations er
  where er.event_id = p_event_id
    and er.status <> 'cancelada'
    and (
      er.full_name ilike '%' || p_query || '%'
      or er.email ilike '%' || p_query || '%'
      or er.phone ilike '%' || p_query || '%'
    )
  order by er.full_name
  limit 15;
end; $$;
grant execute on function public.search_event_registrations(uuid, text) to authenticated;

-- ---------- Quem mais está no mesmo grupo (família/amigos) ----------
create or replace function public.list_group_registrations(p_group_id uuid)
returns table (registration_id uuid, full_name text, status text, checked_in_at timestamptz)
language sql stable security definer set search_path = public as $$
  select id, full_name, status::text, checked_in_at
  from public.event_registrations
  where group_id = p_group_id and status <> 'cancelada'
  order by full_name;
$$;
grant execute on function public.list_group_registrations(uuid) to authenticated;

-- ---------- Check-in individual ----------
create or replace function public.checkin_event_registration(p_registration_id uuid)
returns timestamptz
language plpgsql security definer set search_path = public as $$
declare
  v_church_id uuid;
  v_status text;
  v_already timestamptz;
  v_now timestamptz := now();
begin
  select e.church_id, er.status, er.checked_in_at
    into v_church_id, v_status, v_already
  from public.event_registrations er join public.registration_events e on e.id = er.event_id
  where er.id = p_registration_id;

  if v_status is null then raise exception 'Inscrição não encontrada'; end if;
  if v_church_id is not null and v_church_id not in (select public.accessible_church_ids()) and not public.is_apostle() then
    raise exception 'Sem permissão para fazer check-in nesta inscrição' using errcode = '42501';
  end if;
  if v_status = 'cancelada' then raise exception 'Esta inscrição foi cancelada'; end if;
  if v_already is not null then
    raise exception 'Check-in já registrado às %', to_char(v_already, 'HH24:MI');
  end if;

  update public.event_registrations set checked_in_at = v_now, checked_in_by = auth.uid()
  where id = p_registration_id;

  insert into public.audit_logs (actor_id, action, entity, entity_id)
  values (auth.uid(), 'update', 'event_registration_checkin', p_registration_id);

  return v_now;
end; $$;
grant execute on function public.checkin_event_registration(uuid) to authenticated;

-- ---------- Check-in de grupo (família/amigos que se inscreveram juntos) ----------
create or replace function public.checkin_event_group(p_group_id uuid)
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_count int := 0;
  v_reg record;
begin
  for v_reg in
    select id from public.event_registrations
    where group_id = p_group_id and status <> 'cancelada' and checked_in_at is null
  loop
    perform public.checkin_event_registration(v_reg.id);
    v_count := v_count + 1;
  end loop;
  return v_count;
end; $$;
grant execute on function public.checkin_event_group(uuid) to authenticated;

-- ---------- Últimas entradas (painel de check-in) ----------
create or replace function public.list_recent_event_checkins(p_event_id uuid, p_limit int default 20)
returns table (registration_id uuid, full_name text, checked_in_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
declare
  v_church_id uuid;
begin
  select church_id into v_church_id from public.registration_events where id = p_event_id;
  if v_church_id is not null and v_church_id not in (select public.accessible_church_ids()) and not public.is_apostle() then
    raise exception 'Sem permissão para ver os check-ins deste evento' using errcode = '42501';
  end if;

  return query
  select id, full_name, checked_in_at
  from public.event_registrations
  where event_id = p_event_id and checked_in_at is not null
  order by checked_in_at desc
  limit p_limit;
end; $$;
grant execute on function public.list_recent_event_checkins(uuid, int) to authenticated;

-- ---------- Consulta pública (a própria página do QR do participante — sem dado sensível) ----------
create or replace function public.public_lookup_event_registration(p_registration_id uuid)
returns table (full_name text, event_name text, status text, checked_in_at timestamptz)
language sql stable security definer set search_path = public as $$
  select er.full_name, e.name, er.status::text, er.checked_in_at
  from public.event_registrations er
  join public.registration_events e on e.id = er.event_id
  where er.id = p_registration_id;
$$;
grant execute on function public.public_lookup_event_registration(uuid) to anon, authenticated;
