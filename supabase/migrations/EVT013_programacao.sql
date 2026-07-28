-- ============================================================
-- CEC FAMILY — EVT013: Programação do evento (§9)
-- Cronograma do dia — diferente da lista de palestrantes (event_speakers).
-- Idempotente.
-- ============================================================

create table if not exists public.event_schedule_items (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.registration_events(id) on delete cascade,
  start_at    timestamptz not null,
  end_at      timestamptz,
  title       text not null,
  description text,
  location    text,               -- sala/palco específico, quando o evento tem mais de um espaço
  speaker_id  uuid references public.event_speakers(id) on delete set null,
  order_index int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists idx_event_schedule_event on public.event_schedule_items(event_id, start_at);

alter table public.event_schedule_items enable row level security;

drop policy if exists event_schedule_public_read on public.event_schedule_items;
create policy event_schedule_public_read on public.event_schedule_items for select to anon, authenticated
  using (
    exists (
      select 1 from public.registration_events e
      where e.id = event_id and e.status in (
        'agendado', 'inscricoes_abertas', 'inscricoes_encerradas', 'lotado', 'em_andamento', 'finalizado', 'cancelado'
      )
    )
  );

drop policy if exists event_schedule_staff_write on public.event_schedule_items;
create policy event_schedule_staff_write on public.event_schedule_items for all to authenticated
  using (
    exists (
      select 1 from public.registration_events e
      where e.id = event_id and (public.is_apostle() or e.church_id is null or e.church_id in (select public.accessible_church_ids()))
    )
  )
  with check (
    exists (
      select 1 from public.registration_events e
      where e.id = event_id and (public.is_apostle() or e.church_id is null or e.church_id in (select public.accessible_church_ids()))
    )
  );
