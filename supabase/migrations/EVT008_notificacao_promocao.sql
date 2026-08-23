-- ============================================================
-- CEC FAMILY — EVT008: Notificação de promoção da lista de espera
-- Hoje a promoção (lista_espera -> confirmada) já acontece sozinha
-- dentro de cancel_event_registration, mas em silêncio. Este arquivo
-- só adiciona o rastro pra dar pra avisar o membro depois.
-- Idempotente.
-- ============================================================

alter table public.event_registrations add column if not exists promoted_at timestamptz;
alter table public.event_registrations add column if not exists promotion_notified boolean not null default false;

-- ---------- cancel_event_registration: marca o momento da promoção ----------
create or replace function public.cancel_event_registration(p_registration_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_event_id uuid; v_status text; v_member_id uuid;
begin
  select event_id, status::text, member_id into v_event_id, v_status, v_member_id
  from public.event_registrations where id = p_registration_id;

  if v_event_id is null then raise exception 'Inscrição não encontrada'; end if;

  if not (
    public.is_apostle()
    or exists (
      select 1 from public.registration_events e
      where e.id = v_event_id and (e.church_id is null or e.church_id in (select public.accessible_church_ids()))
    )
    or (v_member_id is not null and exists (select 1 from public.members m where m.id = v_member_id and m.profile_id = auth.uid()))
  ) then
    raise exception 'Sem permissão para cancelar esta inscrição';
  end if;

  update public.event_registrations set status = 'cancelada', cancelled_at = now() where id = p_registration_id;

  if v_status = 'confirmada' then
    update public.event_registrations
    set status = 'confirmada', promoted_at = now(), promotion_notified = false
    where id = (
      select id from public.event_registrations
      where event_id = v_event_id and status = 'lista_espera'
      order by registered_at asc limit 1
    );
  end if;
end;
$$;
grant execute on function public.cancel_event_registration(uuid) to authenticated;

-- ---------- Promoções pendentes de aviso pro membro logado ----------
create or replace function public.list_my_pending_promotions()
returns table (registration_id uuid, event_id uuid, event_name text, event_slug text, promoted_at timestamptz)
language sql stable security definer set search_path = public as $$
  select er.id, e.id, e.name, e.slug, er.promoted_at
  from public.event_registrations er
  join public.registration_events e on e.id = er.event_id
  join public.members m on m.id = er.member_id
  where m.profile_id = auth.uid()
    and er.status = 'confirmada'
    and er.promoted_at is not null
    and er.promotion_notified = false;
$$;
grant execute on function public.list_my_pending_promotions() to authenticated;

-- ---------- Confirmar que o membro já viu o aviso ----------
create or replace function public.acknowledge_event_promotion(p_registration_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.event_registrations er
  set promotion_notified = true
  from public.members m
  where er.id = p_registration_id and er.member_id = m.id and m.profile_id = auth.uid();
end;
$$;
grant execute on function public.acknowledge_event_promotion(uuid) to authenticated;
