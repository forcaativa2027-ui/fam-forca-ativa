-- ============================================================
-- CEC FAMILY — EVT012: Pós-evento (§23)
--  - Encerrar evento / marcar ausentes (quem não fez check-in)
--  - Pesquisa de satisfação (só quem fez check-in pode responder)
--  - Certificado de participação: gerado no cliente (jsPDF já é
--    dependência do projeto), não precisa de nada novo no banco.
-- Idempotente.
-- ============================================================

alter table public.event_registrations add column if not exists no_show boolean not null default false;
alter table public.registration_events add column if not exists attendance_closed_at timestamptz;

-- ---------- Encerrar presença: marca ausente quem não fez check-in ----------
create or replace function public.finalize_event_attendance(p_event_id uuid)
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_church_id uuid;
  v_count int;
begin
  select church_id into v_church_id from public.registration_events where id = p_event_id;
  if v_church_id is not null and v_church_id not in (select public.accessible_church_ids()) and not public.is_apostle() then
    raise exception 'Sem permissão para encerrar a presença deste evento' using errcode = '42501';
  end if;

  update public.event_registrations
  set no_show = true
  where event_id = p_event_id and status = 'confirmada' and checked_in_at is null;
  get diagnostics v_count = row_count;

  update public.registration_events set attendance_closed_at = now() where id = p_event_id;

  return v_count;
end; $$;
grant execute on function public.finalize_event_attendance(uuid) to authenticated;

-- ---------- Pesquisa de satisfação ----------
create table if not exists public.event_feedback (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.registration_events(id) on delete cascade,
  registration_id uuid not null references public.event_registrations(id) on delete cascade,
  member_id     uuid references public.members(id),
  rating        int not null check (rating between 1 and 5),
  comment       text,
  created_at    timestamptz not null default now(),
  unique (event_id, registration_id)
);
alter table public.event_feedback enable row level security;

drop policy if exists event_feedback_staff_read on public.event_feedback;
create policy event_feedback_staff_read on public.event_feedback for select to authenticated
  using (
    exists (
      select 1 from public.registration_events e
      where e.id = event_id and (public.is_apostle() or e.church_id is null or e.church_id in (select public.accessible_church_ids()))
    )
  );

-- Envio só via RPC (valida que a pessoa de fato compareceu) — sem policy de insert direta.

create or replace function public.submit_event_feedback(p_event_id uuid, p_rating int, p_comment text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_member_id uuid;
  v_registration_id uuid;
begin
  if p_rating < 1 or p_rating > 5 then raise exception 'Nota precisa ser de 1 a 5'; end if;

  select m.id into v_member_id from public.members m where m.profile_id = auth.uid() limit 1;
  if v_member_id is null then raise exception 'Cadastro de membro não encontrado'; end if;

  select id into v_registration_id
  from public.event_registrations
  where event_id = p_event_id and member_id = v_member_id and checked_in_at is not null
  limit 1;

  if v_registration_id is null then
    raise exception 'Só quem fez check-in no evento pode responder a pesquisa';
  end if;

  insert into public.event_feedback (event_id, registration_id, member_id, rating, comment)
  values (p_event_id, v_registration_id, v_member_id, p_rating, p_comment)
  on conflict (event_id, registration_id) do update set rating = excluded.rating, comment = excluded.comment;
end; $$;
grant execute on function public.submit_event_feedback(uuid, int, text) to authenticated;

create or replace function public.get_event_feedback_summary(p_event_id uuid)
returns table (total int, average numeric, comments jsonb)
language plpgsql stable security definer set search_path = public as $$
declare
  v_church_id uuid;
begin
  select church_id into v_church_id from public.registration_events where id = p_event_id;
  if v_church_id is not null and v_church_id not in (select public.accessible_church_ids()) and not public.is_apostle() then
    raise exception 'Sem permissão para ver a pesquisa deste evento' using errcode = '42501';
  end if;

  return query
  select
    count(*)::int,
    round(avg(rating), 1),
    coalesce(jsonb_agg(jsonb_build_object('rating', rating, 'comment', comment, 'created_at', created_at) order by created_at desc) filter (where comment is not null and comment <> ''), '[]'::jsonb)
  from public.event_feedback where event_id = p_event_id;
end; $$;
grant execute on function public.get_event_feedback_summary(uuid) to authenticated;

-- ---------- Já respondi? (pro app decidir se mostra o formulário) ----------
create or replace function public.has_submitted_event_feedback(p_event_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.event_feedback ef
    join public.members m on m.id = ef.member_id
    where ef.event_id = p_event_id and m.profile_id = auth.uid()
  );
$$;
grant execute on function public.has_submitted_event_feedback(uuid) to authenticated;
